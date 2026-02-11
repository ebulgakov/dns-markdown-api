import OpenAI from "openai";

const openai = new OpenAI();

const compareLLMGoods = async (data: string) => {
  const prompt = `Сравните приведенные ниже товары и выделите ключевые различия, преимущества и недостатки каждого из них. 
  Составьте краткий отчет в формате Markdown, который поможет пользователю понять, какой товар может быть лучшим выбором для покупки. 
  Не упоминайте цены, если они не указаны. Весь отчет должен быть в формате Markdown - никаких HTML тегов. После отчёта больше ничего не предлагайте - этого достаточно.\n\n${data}\n\nОтчёт:`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "Вы — опытный аналитик данных." },
      { role: "user", content: prompt }
    ]
  });

  return response?.choices[0]?.message?.content?.trim() || "";
};

export { compareLLMGoods };
