import json
import os
import sys

import fitz
import pytesseract
from PIL import Image


def build_error(message):
    return {
        "success": False,
        "text": "",
        "pages": 0,
        "error": message,
    }


def main():
    if len(sys.argv) < 2:
        print(json.dumps(build_error("Missing PDF file path argument")))
        sys.exit(1)

    pdf_path = sys.argv[1]
    tesseract_path = os.environ.get("TESSERACT_PATH")

    if not os.path.exists(pdf_path):
        print(json.dumps(build_error("PDF file does not exist")))
        sys.exit(1)

    if tesseract_path:
        pytesseract.pytesseract.tesseract_cmd = tesseract_path

    try:
        document = fitz.open(pdf_path)
        page_text = []

        # Render each page to an image before OCR so scanned PDFs can be read.
        for page in document:
            pixmap = page.get_pixmap(matrix=fitz.Matrix(2, 2))
            image = Image.frombytes("RGB", [pixmap.width, pixmap.height], pixmap.samples)
            page_text.append(pytesseract.image_to_string(image))

        print(json.dumps({
            "success": True,
            "text": "\n".join(page_text).strip(),
            "pages": len(document),
            "error": None,
        }))
    except Exception as error:
        print(json.dumps(build_error(str(error))))
        sys.exit(1)


if __name__ == "__main__":
    main()


# it receives a pdf file path from node
# opens the pdf with pymupdf and convert each page into an image in memory
# runs tesseract ocr on each page image and joins all extracted page text and prints a json result so ur node backend can read it