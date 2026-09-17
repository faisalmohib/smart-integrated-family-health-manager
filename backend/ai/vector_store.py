from pathlib import Path
import json
import re

import faiss
import numpy as np
import pandas as pd

from ai.embeddings import EmbeddingManager


# =========================================================
# PATHS
# =========================================================

BACKEND_DIR = Path(__file__).resolve().parents[1]
PROJECT_ROOT = BACKEND_DIR.parent

KNOWLEDGE_BASE_DIR = PROJECT_ROOT / "Medical_Knowledge_Base"

DISEASE_SYMPTOM_DIR = KNOWLEDGE_BASE_DIR / "disease-symptom"
MEDQUAD_DIR = KNOWLEDGE_BASE_DIR / "medquad"

DATASET_CSV = DISEASE_SYMPTOM_DIR / "dataset.csv"
DESCRIPTION_CSV = DISEASE_SYMPTOM_DIR / "symptom_Description.csv"
PRECAUTION_CSV = DISEASE_SYMPTOM_DIR / "symptom_precaution.csv"

MEDQUAD_CSV = MEDQUAD_DIR / "medquad.csv"

DATA_DIR = BACKEND_DIR / "data"

# Two separate indices: one small, high-precision index of
# diseases (used to find WHICH condition(s) fit the symptoms),
# and one large index of MedQuAD Q&A pairs (used to fetch
# explanatory/home-care information about those conditions).

DISEASE_INDEX_PATH = DATA_DIR / "disease_faiss.index"
DISEASE_METADATA_PATH = DATA_DIR / "disease_metadata.json"

MEDQUAD_INDEX_PATH = DATA_DIR / "medquad_faiss.index"
MEDQUAD_METADATA_PATH = DATA_DIR / "medquad_metadata.json"


# =========================================================
# SMALL TEXT HELPERS
# =========================================================

def clean_text(text: str) -> str:
    """
    Light cleanup used on every piece of text before it is
    embedded (CSV cells, questions, answers, etc).
    """

    if not isinstance(text, str):
        return ""

    text = re.sub(r"https?://\S+", " ", text)
    text = re.sub(r"\s+", " ", text)

    return text.strip()


def _find_column(columns, candidates):
    """
    Case-insensitive lookup for the first matching column
    name out of a list of candidate names. Different
    downloads of the same public dataset sometimes use
    slightly different header casing/spacing, so we do not
    assume an exact match.
    """

    lowered = {c.lower().strip(): c for c in columns}

    for candidate in candidates:

        if candidate.lower() in lowered:
            return lowered[candidate.lower()]

    return None


# =========================================================
# LOAD: DISEASE -> SYMPTOM DATASET
# =========================================================

def load_disease_symptom_documents() -> list[dict]:
    """
    Builds ONE natural-language document per disease from:

      dataset.csv             (Disease, Symptom_1..Symptom_N)
      symptom_Description.csv (Disease, Description)
      symptom_precaution.csv  (Disease, Precaution_1..4)

    Returns:
        [{"disease": "Common Cold", "text": "..."}, ...]
    """

    for path in (DATASET_CSV, DESCRIPTION_CSV, PRECAUTION_CSV):

        if not path.exists():
            raise FileNotFoundError(f"Required file not found:\n{path}")

    dataset_df = pd.read_csv(DATASET_CSV)
    description_df = pd.read_csv(DESCRIPTION_CSV)
    precaution_df = pd.read_csv(PRECAUTION_CSV)

    disease_col = _find_column(dataset_df.columns, ["Disease"])
    symptom_cols = [c for c in dataset_df.columns if c != disease_col]

    disease_symptoms: dict[str, set[str]] = {}

    for _, row in dataset_df.iterrows():

        disease = clean_text(row[disease_col])

        if not disease:
            continue

        symptoms = disease_symptoms.setdefault(disease, set())

        for col in symptom_cols:

            value = row[col]

            if pd.isna(value):
                continue

            value = str(value).strip().replace("_", " ")

            if value and value.lower() != "nan":
                symptoms.add(value)

    desc_disease_col = _find_column(description_df.columns, ["Disease"])
    desc_text_col = _find_column(description_df.columns, ["Description"])

    descriptions = {
        clean_text(row[desc_disease_col]): clean_text(row[desc_text_col])
        for _, row in description_df.iterrows()
    }

    prec_disease_col = _find_column(precaution_df.columns, ["Disease"])
    prec_cols = [c for c in precaution_df.columns if c != prec_disease_col]

    precautions = {}

    for _, row in precaution_df.iterrows():

        disease = clean_text(row[prec_disease_col])
        steps = []

        for col in prec_cols:

            value = row[col]

            if pd.isna(value):
                continue

            value = clean_text(str(value))

            if value and value.lower() != "nan":
                steps.append(value)

        precautions[disease] = steps

    documents = []

    for disease, symptoms in disease_symptoms.items():

        description = descriptions.get(disease, "")
        precaution_steps = precautions.get(disease, [])

        symptom_line = ", ".join(sorted(symptoms)) if symptoms else "Not specified"
        precaution_line = (
            "; ".join(precaution_steps) if precaution_steps else "Not specified"
        )

        text = (
            f"Disease: {disease}\n"
            f"Symptoms: {symptom_line}\n"
            f"Description: {description or 'Not specified'}\n"
            f"Home care / Precautions: {precaution_line}"
        )

        documents.append({"disease": disease, "text": text})

    return documents


# =========================================================
# LOAD: MEDQUAD DATASET
# =========================================================

def load_medquad_documents() -> list[dict]:
    """
    Builds one document per MedQuAD question/answer pair.

    Returns:
        [{"disease": "Diabetes", "text": "Question: ...\nAnswer: ..."}, ...]
    """

    if not MEDQUAD_CSV.exists():
        raise FileNotFoundError(f"Required file not found:\n{MEDQUAD_CSV}")

    medquad_df = pd.read_csv(MEDQUAD_CSV)

    question_col = _find_column(medquad_df.columns, ["question", "Question"])
    answer_col = _find_column(medquad_df.columns, ["answer", "Answer"])
    focus_col = _find_column(
        medquad_df.columns,
        ["focus_area", "Focus_Area", "disease", "Disease"]
    )

    if not question_col or not answer_col:
        raise ValueError(
            "medquad.csv must contain a question column and an answer "
            f"column. Found columns: {list(medquad_df.columns)}"
        )

    documents = []

    for _, row in medquad_df.iterrows():

        question = clean_text(row[question_col])
        answer = clean_text(row[answer_col])

        if not question or not answer:
            continue

        disease = clean_text(row[focus_col]) if focus_col else ""

        documents.append({
            "disease": disease,
            "text": f"Question: {question}\nAnswer: {answer}",
        })

    return documents


# =========================================================
# CREATE VECTOR DATABASE (TWO SEPARATE INDICES)
# =========================================================

def create_vector_store():

    DATA_DIR.mkdir(parents=True, exist_ok=True)

    print("\n========================================")
    print("Building Medical Knowledge Base")
    print("========================================")

    embedding_manager = EmbeddingManager()

    # =====================================================
    # 1) DISEASE-SYMPTOM INDEX
    # =====================================================

    print(f"\nReading disease-symptom dataset from:\n{DISEASE_SYMPTOM_DIR}")

    disease_docs = load_disease_symptom_documents()

    print(f"Disease documents built: {len(disease_docs)}")

    disease_texts = [d["text"] for d in disease_docs]
    disease_metadata = [
        {
            "source": "disease-symptom-dataset",
            "source_type": "disease_symptom",
            "disease": d["disease"],
            "chunk": i,
            "text": d["text"],
        }
        for i, d in enumerate(disease_docs, start=1)
    ]

    print("Embedding disease documents...")

    disease_embeddings = embedding_manager.embed_documents(disease_texts)

    disease_index = faiss.IndexFlatIP(disease_embeddings.shape[1])
    disease_index.add(disease_embeddings)

    faiss.write_index(disease_index, str(DISEASE_INDEX_PATH))

    with open(DISEASE_METADATA_PATH, "w", encoding="utf-8") as file:
        json.dump(disease_metadata, file, ensure_ascii=False, indent=2)

    # =====================================================
    # 2) MEDQUAD INDEX
    # =====================================================

    print(f"\nReading MedQuAD dataset from:\n{MEDQUAD_DIR}")

    medquad_docs = load_medquad_documents()

    print(f"MedQuAD documents built: {len(medquad_docs)}")

    medquad_texts = [d["text"] for d in medquad_docs]
    medquad_metadata = [
        {
            "source": "medquad",
            "source_type": "medquad",
            "disease": d["disease"],
            "chunk": i,
            "text": d["text"],
        }
        for i, d in enumerate(medquad_docs, start=1)
    ]

    print("Embedding MedQuAD documents (this can take a while)...")

    medquad_embeddings = embedding_manager.embed_documents(medquad_texts)

    medquad_index = faiss.IndexFlatIP(medquad_embeddings.shape[1])
    medquad_index.add(medquad_embeddings)

    faiss.write_index(medquad_index, str(MEDQUAD_INDEX_PATH))

    with open(MEDQUAD_METADATA_PATH, "w", encoding="utf-8") as file:
        json.dump(medquad_metadata, file, ensure_ascii=False, indent=2)

    print("\n========================================")
    print("Vector database created successfully!")
    print("========================================")
    print(f"Disease index:  {DISEASE_INDEX_PATH}  ({len(disease_metadata)} docs)")
    print(f"MedQuAD index:  {MEDQUAD_INDEX_PATH}  ({len(medquad_metadata)} docs)")


# =========================================================
# LOAD VECTOR DATABASE
# =========================================================

def load_vector_store():

    if not (
        DISEASE_INDEX_PATH.exists()
        and DISEASE_METADATA_PATH.exists()
        and MEDQUAD_INDEX_PATH.exists()
        and MEDQUAD_METADATA_PATH.exists()
    ):

        print("\nVector database does not exist. Creating it now...")
        create_vector_store()

    disease_index = faiss.read_index(str(DISEASE_INDEX_PATH))
    medquad_index = faiss.read_index(str(MEDQUAD_INDEX_PATH))

    with open(DISEASE_METADATA_PATH, "r", encoding="utf-8") as file:
        disease_metadata = json.load(file)

    with open(MEDQUAD_METADATA_PATH, "r", encoding="utf-8") as file:
        medquad_metadata = json.load(file)

    embedding_manager = EmbeddingManager()

    return (
        disease_index,
        disease_metadata,
        medquad_index,
        medquad_metadata,
        embedding_manager,
    )


# =========================================================
# SEARCH: TWO-STAGE RETRIEVAL
# =========================================================

def search_medical_knowledge(
    query: str,
    top_k: int = 5,
    min_score: float = 0.35,
    top_k_diseases: int = 3,
    disease_min_score: float = 0.30,
):
    """
    Two-stage retrieval:

    STAGE 1 - Search the disease-symptom index to find which
    disease(s) best match the reported symptoms.

    STAGE 2 - Use those disease names to search ONLY the
    MedQuAD entries that belong to those diseases (metadata
    filter), instead of a blind similarity search across all
    of MedQuAD. This avoids pulling in generic "what is
    Fever" / "what is Sore Throat" pages, or unrelated rare
    diseases that happen to share wording.

    If stage 1 finds no confident disease match (e.g. a vague
    or off-topic query), stage 2 falls back to a blind top_k
    search across all of MedQuAD so the bot still answers
    general medical questions correctly.
    """

    (
        disease_index,
        disease_metadata,
        medquad_index,
        medquad_metadata,
        embedding_manager,
    ) = load_vector_store()

    query_embedding = embedding_manager.embed_query(query)

    # =====================================================
    # STAGE 1: DISEASE MATCH
    # =====================================================

    disease_search_k = min(top_k_diseases * 3, disease_index.ntotal)

    d_scores, d_indices = disease_index.search(
        query_embedding, disease_search_k
    )

    disease_results = []
    seen_diseases = set()

    for score, pos in zip(d_scores[0], d_indices[0]):

        if pos == -1:
            continue

        score = float(score)

        if score < disease_min_score:
            continue

        doc = disease_metadata[pos]
        disease_name = doc["disease"]

        if disease_name.lower() in seen_diseases:
            continue

        seen_diseases.add(disease_name.lower())

        disease_results.append({
            "source": doc["source"],
            "source_type": doc["source_type"],
            "disease": disease_name,
            "chunk": doc["chunk"],
            "text": doc["text"],
            "score": round(score, 4),
        })

        if len(disease_results) >= top_k_diseases:
            break

    # =====================================================
    # STAGE 2: MEDQUAD LOOKUP
    # =====================================================

    medquad_results = []

    if disease_results:

        # Restrict MedQuAD search to rows whose disease
        # matches one of the diseases found in stage 1.

        candidate_names = {d["disease"].lower() for d in disease_results}

        candidate_positions = [
            i for i, doc in enumerate(medquad_metadata)
            if doc.get("disease", "").lower() in candidate_names
        ]

    else:

        candidate_positions = []

    if candidate_positions:

        # Reconstruct the stored embeddings for just these
        # candidates and score them manually against the
        # query (cheap: candidate set is small).

        candidate_embeddings = np.array([
            medquad_index.reconstruct(i) for i in candidate_positions
        ], dtype="float32")

        sims = candidate_embeddings @ query_embedding[0]

        ranked = sorted(
            zip(candidate_positions, sims),
            key=lambda x: x[1],
            reverse=True,
        )

        for pos, score in ranked:

            score = float(score)

            if score < min_score:
                continue

            doc = medquad_metadata[pos]

            medquad_results.append({
                "source": doc["source"],
                "source_type": doc["source_type"],
                "disease": doc.get("disease", ""),
                "chunk": doc["chunk"],
                "text": doc["text"],
                "score": round(score, 4),
            })

            if len(medquad_results) >= top_k:
                break

    if not medquad_results:

        # FALLBACK: no disease match, or no MedQuAD rows
        # tagged with that disease name -> blind search
        # across all of MedQuAD so general questions still
        # get answered.

        search_k = min(top_k * 3, medquad_index.ntotal)

        m_scores, m_indices = medquad_index.search(query_embedding, search_k)

        seen_chunks = set()

        for score, pos in zip(m_scores[0], m_indices[0]):

            if pos == -1:
                continue

            score = float(score)

            if score < min_score:
                continue

            doc = medquad_metadata[pos]

            chunk_key = (doc["source"], doc["chunk"])

            if chunk_key in seen_chunks:
                continue

            seen_chunks.add(chunk_key)

            medquad_results.append({
                "source": doc["source"],
                "source_type": doc["source_type"],
                "disease": doc.get("disease", ""),
                "chunk": doc["chunk"],
                "text": doc["text"],
                "score": round(score, 4),
            })

            if len(medquad_results) >= top_k:
                break

    # =====================================================
    # COMBINE: disease matches first, then supporting info
    # =====================================================

    return disease_results + medquad_results


# =========================================================
# TEST VECTOR DATABASE
# =========================================================

if __name__ == "__main__":

    create_vector_store()

    print("\nTesting retrieval...\n")

    query = "I have fever, cough and sore throat"

    results = search_medical_knowledge(query=query, top_k=5)

    for number, result in enumerate(results, start=1):

        print(f"\nResult {number}")
        print(f"Source: {result['source']} ({result['source_type']})")
        print(f"Disease: {result['disease']}")
        print(f"Score: {result['score']}")
        print(f"Text: {result['text'][:400]}")
        print("-" * 60)
