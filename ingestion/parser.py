"""
ingestion/parser.py
Multi-format document parsing module for Vault AI.
Supports:
- PDF files (.pdf)
- PowerPoint presentations (.pptx)
- Plain text files (.txt)

Extracts content while preserving page/slide metadata for citation tracking.
"""

import os
from typing import List, Dict, Any

def parse_document(
    file_path: str,
    source_name: str | None = None,
) -> List[Dict[str, Any]]:
    """
    Parses a document file and extracts structured text page-by-page or slide-by-slide.
    
    Args:
        file_path (str): The path to the document file.
        
    Returns:
        List[Dict[str, Any]]: A list of dictionaries containing:
            - 'text': Extracted text content.
            - 'page_number': Page or Slide index (1-indexed).
            - 'source': Base file name.
            
    Raises:
        FileNotFoundError: If the file does not exist.
        ValueError: If the file format is unsupported.
    """
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"File not found: {file_path}")

    filename = source_name or os.path.basename(file_path)
    extension = os.path.splitext(filename)[1].lower()
    pages_data: List[Dict[str, Any]] = []

    # ==========================================
    # 1. PDF Document Parsing (.pdf)
    # ==========================================
    if extension == ".pdf":
        import pypdf
        reader = pypdf.PdfReader(file_path)
        for idx, page in enumerate(reader.pages):
            text = page.extract_text() or ""
            if text.strip():
                pages_data.append({
                    "text": text.strip(),
                    "page_number": idx + 1,
                    "source": filename
                })

    # ==========================================
    # 2. PowerPoint Presentation Parsing (.pptx)
    # ==========================================
    elif extension == ".pptx":
        from pptx import Presentation
        prs = Presentation(file_path)
        
        for slide_idx, slide in enumerate(prs.slides, start=1):
            slide_text_blocks = []
            
            # Extract text from all shapes containing text frames
            for shape in slide.shapes:
                if shape.has_text_frame:
                    for paragraph in shape.text_frame.paragraphs:
                        text = paragraph.text.strip()
                        if text:
                            slide_text_blocks.append(text)
                            
            full_slide_text = "\n".join(slide_text_blocks)
            if full_slide_text.strip():
                pages_data.append({
                    "text": full_slide_text.strip(),
                    "page_number": slide_idx,  # Slide number maps directly to page number
                    "source": filename
                })

    # ==========================================
    # 3. Plain Text File Parsing (.txt)
    # ==========================================
    elif extension == ".txt":
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            content = f.read()

        current_page = None
        current_text = []

        for line in content.splitlines():
            line = line.strip()

        # Detect page markers such as:
        # --- Page 1 ---
        # --- Page 2 ---
            if line.startswith("--- Page ") and line.endswith(" ---"):
            # Save the previous page before starting a new one.
                if current_page is not None:
                    page_text = "\n".join(current_text).strip()

                    if page_text:
                        pages_data.append({
                            "text": page_text,
                            "page_number": current_page,
                            "source": filename,
                        })    

            # Extract page number.
                page_number_text = line[len("--- Page "):-len(" ---")]

                try:
                    current_page = int(page_number_text)
                except ValueError:
                    current_page = None

                current_text = []

            elif current_page is not None:
                current_text.append(line)

    # Save the final page.
        if current_page is not None:
            page_text = "\n".join(current_text).strip()

            if page_text:
                pages_data.append({
                    "text": page_text,
                    "page_number": current_page,
                    "source": filename,
                })

    else:
        raise ValueError(
            f"Unsupported format: {extension}. Supported formats are .pdf, .pptx, and .txt."
        )

    return pages_data


if __name__ == "__main__":
    print("✅ Parser module initialized successfully. Supported formats: PDF, PPTX, TXT.")