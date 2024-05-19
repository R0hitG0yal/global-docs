import OpenAI from "openai";

const key = "process.env.OPENAI_SECRET";

const openAi = new OpenAI({
  apiKey: key,
});

const generateResponse = async (messages: any) => {
  const completion = await openAi.chat.completions.create({
    messages,
    model: "gpt-3.5-turbo",
  });
};

export { generateResponse };
