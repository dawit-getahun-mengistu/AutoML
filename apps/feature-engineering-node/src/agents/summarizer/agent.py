import os
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_openai import ChatOpenAI
from dotenv import find_dotenv, load_dotenv

load_dotenv(find_dotenv())

llm = ChatOpenAI(
    base_url=os.environ.get("BASE_URL"),
    api_key=os.environ.get("API_KEY"),
    model=os.environ.get("MODEL_NAME"),
    temperature=1,
)


from langchain.prompts import ChatPromptTemplate

PROMPT = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            """
You are an expert data scientist and a skilled frontend developer. Your task is to generate an explanatory HTML report body based on a JSON object of learned machine learning parameters.

The generated code will be placed inside a pre-existing HTML template. The template already includes Bootstrap 5, Tailwind CSS, and Vega-Lite.

**Your primary goal is to explain what the parameters MEAN, not just list them.** Act as if you are explaining the feature engineering process to a colleague.


Follow these instructions precisely:

1.  Content and Tone:
    *   Your tone must be direct, informative, and data-driven.
    *   AVOID generic introductory phrases like "This report summarizes...".
    *   DO start directly with the findings.

2.  Main Container:
    *   Your entire output MUST be wrapped in a single main container <div>.
    *   Style this container with Tailwind CSS: <div class="max-w-4xl mx-auto my-8 p-6 bg-white rounded-xl shadow-md">...</div>
  
3.  Component Usage and Styling:
    *   Headings (`h1`-`h4`): Use for titles and subtitles. They MUST be styled with the class text-[#1a237e] and should be bold.
    *   Lists of Items (Chips): When listing items like column names, you MUST use Bootstrap Badges (chips). Don't overuse this, it makes the pasge ugly
    *   Tables: Use Bootstrap tables only for data that cannot be effectively visualized in a chart.

4.  JavaScript and Visualization (CRITICAL RULES):

    *   A. JavaScript Execution: To prevent charts from failing to load, your entire <script> block MUST be wrapped in a DOMContentLoaded event listener.
        *   Correct Structure:
                        <script>
              document.addEventListener('DOMContentLoaded', function() {{
                // All your vegaEmbed calls go inside here.
              }});
            </script>
            
🛑 IMPORTANT CONSTRAINTS:
- Your output MUST ONLY be the content for the `<body>` tag.
- Do NOT include `<!DOCTYPE html>`, `<html>`, `<head>`, or `<body>` tags.
- Do NOT include any `<link>` or external `<script>` tags.
- Do NOT explain your code. Just return the raw HTML and JavaScript content for the body.
- Do not use a table if you have already visualized the same data in a chart. And vise versa
- Ensure Chart Reliability: All charts MUST be generated according to the critical rules in Section 4 to ensure they are visible, correctly sized, and syntactically valid.
- Don't overcomplicate charts: stick to line charts, pie charts, bar graphs and avoid complex chart definitions that might cause issues in vega**
- Make sure to use the max width for the charts

Here is the JSON context you will use to generate the report body:

{learned_parameters}
""",
        )
    ]
)

page_generator = PROMPT | llm | StrOutputParser()
