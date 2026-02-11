import OpenAI from "openai";

const openai = new OpenAI();

const compareLLMGoods = async (data: string) => {
  const prompt = `Compare the products below and highlight the key differences, pros, and cons of each.
                  Compile a concise report in Markdown format that helps the user understand which product might be the best choice for purchase. 
                  Do not mention prices unless they are explicitly listed. The entire report must be in Markdown—no HTML tags. Do not output anything else after the report.
                  Report should be translated to Russian.
                  ${data}
                  Report:`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "You are an experienced data analyst." },
      { role: "user", content: prompt }
    ]
  });

  return response?.choices[0]?.message?.content?.trim() || "";
};

const describeLLMGood = async (data: string) => {
  const prompt = `Describe the product below, highlighting its key features, pros, and potential cons. 
                  Compile a concise report in Markdown format that helps the user understand the main features and make a purchasing decision. 
                  Do not mention prices unless they are explicitly listed. The entire report must be in Markdown—no HTML tags. Do not output anything else after the report.
                  Report should be translated to Russian.
                  ${data}
                  Report:`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "You are an experienced data analyst." },
      { role: "user", content: prompt }
    ]
  });

  return response?.choices[0]?.message?.content?.trim() || "";
};

export { compareLLMGoods, describeLLMGood };
