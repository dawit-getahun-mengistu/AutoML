import os
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_openai import ChatOpenAI
from dotenv import find_dotenv, load_dotenv

load_dotenv(find_dotenv())

llm = ChatOpenAI(
    base_url=os.environ.get('BASE_URL'),
    api_key=os.environ.get('API_KEY'),
    model=os.environ.get('MODEL_NAME'),
    temperature=1
)


from langchain.prompts import ChatPromptTemplate

PROMPT = ChatPromptTemplate.from_messages(
  [
    (
      "system",
      """
You are an expert data scientis specialized in generating comprehesive reports for data science projects.
Your task is to generate an overview report for a data science project based on the provided context.
You will receive JSON contexts for data profiling, feature engineering, feature selection, and model training.
Your response should be a well-structured report that summarizes the key findings and insights from the provided contexts.
Don't include any emojis or unnecessary formatting. Give me a well structured html.

**Follow these instructions precisely:**

1.  **Content and Tone:**
    *   Your tone must be direct, informative, and data-driven.
    *   **AVOID** generic introductory phrases like "This report summarizes...".
    *   **DO** start directly with the findings.

2.  **Main Container:**
    *   Your entire output MUST be wrapped in a single main container `<div>`.
    *   Style this container with Tailwind CSS: `<div class="max-w-4xl mx-auto my-8 p-6 bg-white rounded-xl shadow-md">...</div>`
  
3.  **Component Usage and Styling:**
    *   **Headings (`h1`-`h4`):** Use for titles and subtitles. They **MUST** be styled with the class `text-[#1a237e]` and should be bold.
    *   **Lists of Items (Chips):** When listing items like column names, you **MUST** use Bootstrap Badges (chips). Don't overuse this, it makes the pasge ugly
    *   **Tables:** Use Bootstrap tables **only** for data that cannot be effectively visualized in a chart.

4.  **JavaScript and Visualization (CRITICAL RULES):**

    *   **A. JavaScript Execution:** To prevent charts from failing to load, your entire `<script>` block **MUST** be wrapped in a `DOMContentLoaded` event listener.
        *   **Correct Structure:**
            ```html
            <script>
              document.addEventListener('DOMContentLoaded', function() {{
                // All your vegaEmbed calls go inside here.
              }});
            </script>
            ```
**🛑 IMPORTANT CONSTRAINTS:**
- **Your output MUST ONLY be the content for the `<body>` tag.**
- **Do NOT include `<!DOCTYPE html>`, `<html>`, `<head>`, or `<body>` tags.**
- **Do NOT include any `<link>` or external `<script>` tags.**
- **Do NOT explain your code.** Just return the raw HTML and JavaScript content for the body.
- **Do not use a table if you have already visualized the same data in a chart. And vise versa**
- **Ensure Chart Reliability:** All charts MUST be generated according to the critical rules in Section 4 to ensure they are visible, correctly sized, and syntactically valid.
- **Don't overcomplicate charts**: stick to line charts, pie charts, bar graphs and avoid complex chart definitions that might cause issues in vega**
- **Make sure to use the max width for the charts**

Here is the context:
- Data Profiling Context: {profiling_context}
- Feature Engineering Context: {feature_engineering_context}
- Feature Selection Context: {feature_selection_context}
- Model Training Context: {model_training_context}
""",
    )
  ]
)

report_generator = PROMPT | llm | StrOutputParser()
