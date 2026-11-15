
from pathlib import Path

from pypdf import PdfReader
from docx import Document


UPLOAD_FOLDER = Path(__file__).parent / "uploads"

ALLOWED_EXTENSIONS = {
    ".pdf",
    ".docx",
    ".png",
    ".jpg",
    ".jpeg"
}


def is_allowed_file(filename):
    extension = Path(filename).suffix.lower()
    return extension in ALLOWED_EXTENSIONS


def extract_pdf_text(file_path):
    reader = PdfReader(str(file_path))

    pages = []

    for page in reader.pages:
        text = page.extract_text()

        if text:
            pages.append(text)

    return "\n".join(pages)


def extract_word_text(file_path):
    document = Document(file_path)

    paragraphs = []

    for paragraph in document.paragraphs:
        if paragraph.text.strip():
            paragraphs.append(paragraph.text)

    return "\n".join(paragraphs)


def process_file(file_path):
    file_path = Path(file_path)
    extension = file_path.suffix.lower()

    if extension == ".pdf":
        return extract_pdf_text(file_path)

    elif extension == ".docx":
        return extract_word_text(file_path)

    elif extension in {".png", ".jpg", ".jpeg"}:
        return "Image uploaded successfully."

    else:
        raise ValueError("Unsupported file type.")
