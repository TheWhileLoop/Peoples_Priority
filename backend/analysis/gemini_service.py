import os
import json
import logging
from google import genai
from google.genai import types
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)

# Initialize GenAI Client using key from environment
def get_genai_client():
    api_key = os.getenv('GEMINI_API_KEY')
    if not api_key or api_key == 'your_gemini_api_key_here':
        # Fallback to direct env lookup or return None
        logger.warning("GEMINI_API_KEY is not properly set.")
    return genai.Client(api_key=api_key)

# 1. Define the Pydantic schema for structured output
class ComplaintAnalysisSchema(BaseModel):
    category: str = Field(description="Must be roads, water, electricity, sanitation, health, safety, animals, or other")
    department: str = Field(description="The matching department name: PWD, Jal Board, DISCOM, Sanitation Dept, Health Department, Police Department, Veterinary Department, or Collectorate Office")
    severity_score: float = Field(description="Severity rating from 0.0 to 10.0")
    sentiment: str = Field(description="Sentiment: Highly Frustrated, Concerned, or Informational")
    ai_summary: str = Field(description="A concise 1-2 sentence summary of the civic issue in clean English")


# 2. Main analysis service
def analyze_civic_complaint(description, image_url=None, audio_url=None):
    """
    Calls Google Gemini 1.5 Flash to transcribe audio, describe images, 
    and output a structured classification of category, severity, sentiment, and summary.
    """
    client = get_genai_client()
    contents = []

    # System instruction guiding categorization, severity, and department matching
    system_instruction = (
        "You are the AI Routing and Severity Analyzer for 'People's Priority' (a civic complaint portal in India).\n"
        "Your task is to analyze a citizen's civic complaint (which may be text, audio, or a photo).\n\n"
        "Classify and score the complaint based on these strict guidelines:\n"
        "1. Category: Must be exactly one of: 'roads', 'water', 'electricity', 'sanitation', 'health', 'safety', 'animals', 'other'.\n"
        "2. Responsible Department:\n"
        "   - 'roads' -> 'PWD'\n"
        "   - 'water' -> 'Jal Board'\n"
        "   - 'electricity' -> 'DISCOM'\n"
        "   - 'sanitation' -> 'Sanitation Dept'\n"
        "   - 'health' -> 'Health Department'\n"
        "   - 'safety' -> 'Police Department'\n"
        "   - 'animals' -> 'Veterinary Department'\n"
        "   - 'other' -> 'Collectorate Office'\n"
        "3. Severity Score (0.0 to 10.0):\n"
        "   - 0.0 to 3.0 (Low): Minor sanitation piles, tiny road cracks, single streetlight out.\n"
        "   - 3.1 to 7.0 (Medium): General water cuts, recurring garbage dumping, multiple unlit streetlights.\n"
        "   - 7.1 to 10.0 (High/Critical): Live wire sparking, major pothole causing accidents, contaminated water, health hazard.\n"
        "4. Sentiment: Must be 'Highly Frustrated', 'Concerned', or 'Informational'.\n"
        "5. AI Summary: A clean 1-2 sentence summary in English describing the core issue.\n"
    )

    user_prompt = f"Analyze the following complaint:\nDescription: {description or 'None provided.'}\n"

    # Handle image media if available
    if image_url:
        try:
            # We can download the image bytes or pass it as Part
            import requests
            img_response = requests.get(image_url, timeout=10)
            if img_response.status_code == 200:
                image_part = types.Part.from_bytes(
                    data=img_response.content,
                    mime_type=img_response.headers.get('content-type', 'image/jpeg')
                )
                contents.append(image_part)
                user_prompt += "\nAn image has been attached to this complaint. Inspect it for visual evidence."
        except Exception as e:
            logger.error(f"Failed to fetch image from URL {image_url}: {e}")

    # Handle audio media if available
    if audio_url:
        try:
            import requests
            audio_response = requests.get(audio_url, timeout=10)
            if audio_response.status_code == 200:
                audio_part = types.Part.from_bytes(
                    data=audio_response.content,
                    mime_type=audio_response.headers.get('content-type', 'audio/mp3')
                )
                contents.append(audio_part)
                user_prompt += "\nAn audio recording has been attached. Listen to it and transcribe/analyze it."
        except Exception as e:
            logger.error(f"Failed to fetch audio from URL {audio_url}: {e}")

    contents.append(user_prompt)

    try:
        response = client.models.generate_content(
            model='gemini-2.0-flash',
            contents=contents,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                response_mime_type="application/json",
                response_schema=ComplaintAnalysisSchema,
                temperature=0.1
            )
        )
        return json.loads(response.text)
    except Exception as e:
        logger.error(f"Gemini API execution error: {e}")
        # Return fallback values in case of API error so system doesn't crash
        return {
            "category": "other",
            "department": "Collectorate Office",
            "severity_score": 3.0,
            "sentiment": "Concerned",
            "ai_summary": description[:100] if description else "New civic complaint submitted."
        }
