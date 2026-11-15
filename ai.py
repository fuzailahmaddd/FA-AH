
import base64
from pathlib import Path

import requests


OLLAMA_URL = "http://127.0.0.1:11434/api/chat"

CHAT_MODEL = "qwen2.5:0.5b"
VISION_MODEL = "moondream"


def generate_response(message):

    try:
        response = requests.post(
            OLLAMA_URL,
            json={
                "model": CHAT_MODEL,
                "messages": [
                    {
                        "role": "user",
                        "content": message
                    }
                ],
                "stream": False
            },
            timeout=120
        )

        response.raise_for_status()

        data = response.json()

        return data["message"]["content"]

    except requests.exceptions.RequestException as error:
        raise RuntimeError(
            f"Qwen AI connection failed: {error}"
        )


def analyze_image(image_path, question):

    image_path = Path(image_path)

    if not image_path.is_file():
        raise FileNotFoundError("Image not found.")

    try:
        with open(image_path, "rb") as image_file:
            image_data = base64.b64encode(
                image_file.read()
            ).decode("utf-8")

        response = requests.post(
            OLLAMA_URL,
            json={
                "model": VISION_MODEL,
                "messages": [
                    {
                        "role": "user",
                        "content": question,
                        "images": [image_data]
                    }
                ],
                "stream": False
            },
            timeout=180
        )

        response.raise_for_status()

        data = response.json()

        return data["message"]["content"]

    except requests.exceptions.RequestException as error:
        raise RuntimeError(
            f"Image analysis failed: {error}"
        )
