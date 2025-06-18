from agents.agent import report_generator
from markdown2 import markdown
from xhtml2pdf import pisa
from services.s3_service import S3Service

s3_service = S3Service()

def save_html(summary: str):
    summary = summary.replace("`", "").replace("html", "")
    resulting_page = f"""
      <!DOCTYPE html>
  <html lang="en">
    <head>
      <title>Declarative Report with Bootstrap & Tailwind</title>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />

      <!-- 1. CSS Frameworks -->
      <!-- Bootstrap CSS for components -->
      <link
        href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css"
        rel="stylesheet"
        integrity="sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH"
        crossorigin="anonymous"
      />
      <!-- Tailwind CSS for utility-first styling -->
      <script src="https://cdn.tailwindcss.com"></script>

      <!-- 2. JavaScript Libraries -->
      <script src="https://unpkg.com/react@17/umd/react.development.js"></script>
      <script src="https://unpkg.com/react-dom@17/umd/react-dom.development.js"></script>
      <script src="https://cdn.jsdelivr.net/npm/vega@5"></script>
      <script src="https://cdn.jsdelivr.net/npm/vega-lite@5"></script>
      <script src="https://cdn.jsdelivr.net/npm/vega-embed@6"></script>
      <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    </head>

    <body class="bg-gray-100 text-gray-800 font-sans leading-relaxed">
      {summary}
      <script
        src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"
        integrity="sha384-YvpcrYf0tY3lHB60NNkmXc5s9fDVZLESaAA55NDzOxhy9GkcIdslK1eN7N6jIeHz"
        crossorigin="anonymous"
      ></script>
    </body>
  </html>

      """

    print("################## GENERATED SUMMARY ##################")
    print(summary)
    with open("files/report.html", "w", encoding="utf-8") as file:
          file.write(resulting_page)
    return resulting_page

def generate_report(profiling_context, feature_engineering_context, feature_selection_context, model_training_context):
    """
    Generate a comprehensive report based on the provided contexts.
    """
    report = report_generator.invoke({
        "profiling_context": profiling_context,
        "feature_engineering_context": feature_engineering_context,
        "feature_selection_context": feature_selection_context,
        "model_training_context": model_training_context
    })

    report = report.replace('`', '').replace('md', '').strip()

    return report

def md_to_pdf(md_content):
    """
    Convert markdown content to PDF and save it to the specified output file.
    Uses xhtml2pdf instead of WeasyPrint.
    """
    output_file = "files/report.pdf" # Ensure 'files' directory exists

    html_content = markdown(md_content)

    # Open the output PDF file in binary write mode
    with open("files/report.html", "rb") as html_file:
        with open("files/report.pdf", "wb") as pdf_file:
            # Create the PDF from the HTML content
            # pisa.CreatePDF expects a file-like object or a BytesIO object for input HTML
            pisa_status = pisa.CreatePDF(
                src=html_file,  # HTML content as bytes
                dest=pdf_file                             # Destination file handle
            )

    if pisa_status.err:
        print(f"Error generating PDF: {pisa_status.err}")
    else:
        print(f"PDF generated successfully to {output_file}")

def generate_report_from_api(profiling_context, feature_engineering_context, feature_selection_context, model_training_context):
    md = generate_report(
        profiling_context=profiling_context,
        feature_engineering_context=feature_engineering_context,
        feature_selection_context=feature_selection_context,
        model_training_context=model_training_context
        )
    html = save_html(summary=md)

    md_to_pdf(md_content=md)
    return html

def generate_report_from_queue(profiling_context, feature_engineering_context, feature_selection_context, model_training_context):
    import uuid

    try:
      md = generate_report(
          profiling_context=profiling_context,
          feature_engineering_context=feature_engineering_context,
          feature_selection_context=feature_selection_context,
          model_training_context=model_training_context
      )
      save_html(summary=md)

      md_to_pdf(md_content=md)

      with open("files/report.html", "rb") as file:
          html_key = str(uuid.uuid4()) + '.html'
          s3_service.upload_single_file(
              file_obj=file,
              filename="report.html",
              content_type="text/html",
              key=html_key,
          )

      with open("files/report.pdf", "rb") as file:
          pdf_key = str(uuid.uuid4()) + '.pdf'
          s3_service.upload_single_file(
              file_obj=file,
              filename="report.pdf",
              content_type="application/pdf",
              key=pdf_key,
          )

      return {
          "html_key": html_key,
          "pdf_key": pdf_key,
      }
    except Exception as e:
        raise e