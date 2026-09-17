import json
import os

from dotenv import load_dotenv
from groq import Groq

from ai.vector_store import search_medical_knowledge
from ai.prompts import SYSTEM_PROMPT, build_user_prompt


# =========================================================
# LOAD ENVIRONMENT VARIABLES
# =========================================================

load_dotenv()


# =========================================================
# EMERGENCY SAFETY NET
# =========================================================
#
# This is a hard-coded backup check, separate from the LLM
# prompt rules. Prompt instructions can occasionally be
# missed by the model, so this guarantees that if any
# condition in the response matches a known medical
# emergency, the response is corrected before it ever
# reaches the user - regardless of what the LLM generated.

EMERGENCY_CONDITION_KEYWORDS = [
    "heart attack",
    "myocardial infarction",
    "stroke",
    "sepsis",
    "septic shock",
    "anaphylaxis",
    "severe allergic reaction",
    "pulmonary embolism",
    "meningitis",
    "appendicitis",
    "respiratory failure",
    "cardiac arrest",
    "aortic dissection",
]

EMERGENCY_CARE_MESSAGE = (
    "One or more of the possible conditions listed above can "
    "be a medical emergency. Do not rely on home care for "
    "this - seek immediate medical attention (call emergency "
    "services or go to the nearest emergency room)."
)


def _condition_is_emergency(condition_text: str) -> bool:

    text = condition_text.lower()

    return any(
        keyword in text
        for keyword in EMERGENCY_CONDITION_KEYWORDS
    )


def apply_emergency_safety_net(answer: dict) -> dict:
    """
    Guarantees that if any listed condition is a known medical
    emergency:

    1. A clear "seek immediate care" message is present in
       emergency_signs (added if the model didn't include one).
    2. home_care is not left implying the emergency condition
       can be handled at home - a warning is placed at the
       front of home_care so it can't be missed even if other,
       non-emergency home-care tips are also shown.
    """

    conditions = answer.get("conditions", []) or []

    has_emergency_condition = any(
        _condition_is_emergency(str(c)) for c in conditions
    )

    if not has_emergency_condition:
        return answer

    emergency_signs = answer.get("emergency_signs", []) or []

    already_flagged = any(
        "immediate" in str(s).lower() or "emergency" in str(s).lower()
        for s in emergency_signs
    )

    if not already_flagged:
        emergency_signs = [EMERGENCY_CARE_MESSAGE] + list(emergency_signs)

    answer["emergency_signs"] = emergency_signs

    home_care = answer.get("home_care", []) or []

    already_warned = any(
        "emergency" in str(h).lower() for h in home_care
    )

    if not already_warned:
        home_care = [EMERGENCY_CARE_MESSAGE] + list(home_care)

    answer["home_care"] = home_care

    return answer


# =========================================================
# HEALTHCARE RAG
# =========================================================

class HealthcareRAG:

    def __init__(self):

        api_key = os.getenv("GROQ_API_KEY")

        if not api_key:
            raise ValueError(
                "GROQ_API_KEY is missing from the .env file."
            )

        self.model = os.getenv(
            "GROQ_MODEL",
            "llama-3.3-70b-versatile"
        )

        self.client = Groq(
            api_key=api_key
        )

    # =====================================================
    # RETRIEVE MEDICAL CONTEXT
    # =====================================================

    def retrieve_context(
        self,
        symptoms: str,
        top_k: int = 5
    ):

        results = search_medical_knowledge(
            query=symptoms,
            top_k=top_k,
            min_score=0.35
        )

        # -------------------------------------------------
        # No relevant information found
        # -------------------------------------------------

        if not results:

            return (
                "No sufficiently relevant medical information "
                "was found in the available knowledge base.",
                []
            )

        # -------------------------------------------------
        # Build context
        # -------------------------------------------------

        context_parts = []

        for number, result in enumerate(
            results,
            start=1
        ):

            context_parts.append(
                f"""
SOURCE {number}

Origin: {result['source']}
Disease: {result['disease'] or 'Not specified'}

Medical Information:
{result['text']}
"""
            )

        context = (
            "\n"
            "=================================================\n"
        ).join(
            context_parts
        )

        return context, results

    # =====================================================
    # GENERATE GROQ RESPONSE
    # =====================================================

    def generate_response(
        self,
        symptoms: str,
        top_k: int = 5
    ):

        # -------------------------------------------------
        # Retrieve relevant medical information
        # -------------------------------------------------

        context, retrieved_documents = (
            self.retrieve_context(
                symptoms=symptoms,
                top_k=top_k
            )
        )

        # -------------------------------------------------
        # Build prompt
        # -------------------------------------------------

        user_prompt = build_user_prompt(
            symptoms=symptoms,
            context=context
        )

        # -------------------------------------------------
        # Call Groq
        # -------------------------------------------------

        response = self.client.chat.completions.create(

            model=self.model,

            messages=[
                {
                    "role": "system",
                    "content": SYSTEM_PROMPT
                },
                {
                    "role": "user",
                    "content": user_prompt
                }
            ],

            temperature=0.1,

            response_format={
                "type": "json_object"
            }
        )

        # -------------------------------------------------
        # Get model response
        # -------------------------------------------------

        raw_response = (
            response
            .choices[0]
            .message
            .content
        )

        # -------------------------------------------------
        # Convert JSON response
        # -------------------------------------------------

        try:

            answer = json.loads(
                raw_response
            )

        except json.JSONDecodeError:

            answer = {
                "conditions": [],
                "common_causes": [],
                "home_care": [],
                "when_to_seek_medical_advice": [],
                "emergency_signs": [],
                "disclaimer": raw_response
            }

        # -------------------------------------------------
        # Add unique source information
        # -------------------------------------------------

        sources = []

        seen_sources = set()

        for document in retrieved_documents:

            source_key = (
                document["source"],
                document["disease"]
            )

            if source_key in seen_sources:
                continue

            seen_sources.add(
                source_key
            )

            sources.append(
                {
                    "document": document["source"],
                    "disease": document["disease"],
                    "relevance_score": document["score"]
                }
            )

        # -------------------------------------------------
        # Add sources to response
        # -------------------------------------------------

        answer["sources"] = sources

        # -------------------------------------------------
        # Emergency safety net (see top of file)
        # -------------------------------------------------

        answer = apply_emergency_safety_net(answer)

        return answer