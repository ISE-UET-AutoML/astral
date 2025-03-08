import OpenAI from "openai";
import config from '#src/config/config.js'
import User from '#api/models/user.model.js'
const openai_api_key = config.openai_api_key;

const openai = new OpenAI({apiKey: openai_api_key});

let chatHistory = [];
let jsonSumm = "";

const Chat = async (req, res) => {
    const message = req.body.message
    const confirmed = req.body.confirmed

    let topic = ""
    if (req.body.confirmed) {
        topic = "Problem Confirmation"
    } else {
        topic = await topicClassifier(message)
    }

    let isJson = false
    let prompt = "";
    
    if (topic == "Problem Description") {
        prompt = `
            You are an expert in machine learning. Given the problem description: "${message}", you need to provide a clear, natural and self-explanatory respond to help **non-tech** or **low-tech** user to build a machine learning model through a custom AutoML service.
            Respond with the following guidelines:
            - Use the language that matches the given description.
            - Identify the most suitable machine learning task from the following categories with detailed explanation: Image Classification, Text Classification, Tabular Classification, Multimodal Classification.
            - Provide detailed guidance on how to build or collect relevant datasets for this task with examples, how to select features and some suggestions for dataset size.
            - Explain how the dataset should be labeled for training the model.
            - Identify and provide detailed explanation and example of how to calculate and interpret possible metrics for evaluating the model for non-tech users.
            
            After that, **only** provide a JSON object that summarize the project information based on the JSON file "${jsonSumm}".
            
            Instructions for the JSON response:
            - The JSON keys and values must be English. The "project_description" and "project_summary" fields can be written in another language.
            - **Do not** include any headers, summaries, explanations or additional text about the JSON response.
            - If the file is empty or invalid, create a new JSON object based on the following JSON schema.
            - If the file contains valid JSON, update only the relevant fields (listed in the schema) based on the new input while keeping unchanged fields intact.
            - The JSON response must includes the JSON content only, begin with "\`\`\`###json" and end with "\`\`\`".

            # JSON SCHEMA #
            "{
                "task": "<The detected task>",
                "project_description": "${message}",
                "project_task": "<The detected task>",
                "project_summary": "<Detailed summary of the project description only>",
                "metrics_explain": "<Detailed explanation of the related metrics>"
            }"
            
            Then, you ask the user to provide their dataset descriptions for further analysis.
        `
        isJson = true
    } else if (topic == "Dataset Description") {
        prompt = `
            You are an expert in machine learning.

            The user is working on a project with the following information in the JSON content: "${jsonSumm}".
            They described their dataset as follows: "${message}".

            Instructions:
            - If no project description is provided, generate a proper response based on the given dataset description.
            - If no dataset description is provided, guide the user on how to collect relevant datasets for the task.
            - If a dataset description is provided, analyze its suitability for the problem.
            - If the dataset is suitable, confirm its use.
            - If the dataset lacks necessary features or labels, suggest improvements.

            Provide a clear and natural respond with the following guidelines:
            - Use the language that matches the given description.
            - Clearly state whether the dataset is appropriate for the given project.
            - Provide a detailed analysis for the dataset description.
            - If applicable, explain which features are missing and how their absence impacts the project.
            - If applicable, discuss missing labels and their importance for the learning process.
            - Provide suggestions for improving the dataset to make it more suitable for the task.

            After that, **only** provide a JSON object that summarize information in the following structured JSON format based on the given user's JSON content.
            Instructions for the JSON response:
            - The JSON keys and values must be English. The "project_description" and "project_summary" fields can be written in another language.
            - **Do not** include any headers, summaries, explanations or additional text about the JSON response.
            - If the file is empty or invalid, create a new JSON object based on the following JSON schema, but you must let the following fields empty: ["task", "project_description", "project_summary", "metrics_explain"].
            - If the file contains valid JSON, update only the relevant fields (listed in the schema) based on the new input while keeping unchanged fields intact.
            - Only return the JSON content while do not introduce the summarization response (e.g., avoid phrases like "Now, I will summarize...").
            - The JSON response must includes the JSON content only, begin with "\`\`\`###json" and end with "\`\`\`".

            Instructions for the JSON response:
            - The JSON keys and values must be English. The "project_description" and "project_summary" fields can be written in another language.
            - **Do not** include any headers, summaries, explanations or additional text about the JSON response.
            - If the file is empty or invalid, create a new JSON object based on the following JSON schema.
            - If the file contains valid JSON, update only the relevant fields (listed in the schema) based on the new input while keeping unchanged fields intact.
            - The JSON response must includes the JSON content only, begin with "\`\`\`###json" and end with "\`\`\`".

            # JSON SCHEMA #
            "{
                "task": "<The given task>",
                "project_description": "<The given project description>",
                "project_task": "<The given task>",
                "project_summary": "<Detailed summary of the project>",
                "metrics_explain": <JSON-format summary of metrics explanation>,
                "dataset_description": "<The given dataset description>"
                "features": "<List of features>",
                "labels": "<List of labels>",
            }"
            Your summarization must begin with "\`\`\`###json" and end with "\`\`\`", respectively. Make sure the summarization contains the JSON content only to avoid parsing errors.
        `
        isJson = true
    } else if (topic == "Problem Confirmation") {
        const projectList = req.body.projectList.join(", ")
        prompt = `
            You are an expert in machine learning. Given the following JSON object representing the user's information for a potential ML or AI project:
            #JSON object describing user's project#
            \`\`\`json
            ${jsonSumm}
            \`\`\`

            First, generate a suitable project name and include it in the JSON object under the key of "project_name", while keeping other fields intact. However, exclude the following names for being used in the generated project name:

            \`\`\`json
            [${projectList}]
            \`\`\`

            Your response must follow the following guidelines:
            - Respond using the language that matches the field of "project_description" in the provided JSON object.
            - You must not mention about the given user's JSON content, or ask about providing or creating a JSON object with the project's information.
            - If a JSON object describing the project is provided, your response should begin with a detailed report whether we have essential information to be used for a AutoML project with an overview of the project summary, the project task, dataset description with features and labels, followed by your proposed project name, and after that the updated JSON content. After that, you ask the user whether they want to proceed with creating a project. If they want to proceed, tell them to click the "Proceed" button again. If not, tell them to provide further information about the project.
            - If not, do not generate a project name, and tell the user to provide further information about the project including details about the project problem and datasets without mentioning about the JSON object.
            - The JSON response must includes the JSON content only, begin with "\`\`\`###json" and end with "\`\`\`". Do not introduce the JSON section or filler phrases (e.g., avoid phrases like "Here is your JSON content...", or "I will generate a JSON object...").

            Please note that the users are **non-tech** or **low-tech**, not AI experts, so you must focus only on the essential requirements like problem and brief dataset descriptions.
        `
        isJson = true
    } else if (topic == "Metrics Explanation") {
        prompt = `
            You are an expert in machine learning. Your work is to provide detailed explanation of how to calculate and interpret metrics for non-tech users, given the problem in the following JSON file:
            # JSON content #
            \`\`\`json
            ${jsonSumm}
            \`\`\`
            The user provided the following request:
            "${message}"
            If no JSON file is provided, assume a general case of a machine learning problem and explain the requested metrics in simple terms. Make sure your explanations are easy to understand, even for someone who has no prior knowledge of machine learning.
        `
    } else {
        prompt = message
    }

    chatHistory.push({role: "user", content: prompt, displayMessage: message});

    try {
        let response = await gptResponse(chatHistory)
        const originalResponse = response
        response = preprocessLaTeX(response)
        

        const jsonParsed = JsonParser(response)
        const jsonContent = jsonParsed.jsonContent
        const responseText = jsonParsed.responseText
        if (isJson) {
            if (jsonContent) jsonSumm = jsonContent
            if (responseText) response = responseText
        }
        chatHistory.push({role: "assistant", content: originalResponse, displayMessage: response});
        await SaveChatHistory(req, chatHistory, jsonSumm)
        res.json({reply: response, jsonSumm: jsonSumm})
    } catch (error) {
        console.error("Error in fetching response from OpenAI API", error);
        res.status(500).json({ error: "Error: Unable to fetch response." });
    }
}

const preprocessLaTeX = (content) => {
    // Step 1: Protect code blocks
    const codeBlocks = [];
    content = content.replace(/(```[\s\S]*?```|`[^`\n]+`)/g, (match, code) => {
      codeBlocks.push(code);
      return `<<CODE_BLOCK_${codeBlocks.length - 1}>>`;
    });
  
    // Step 2: Protect existing LaTeX expressions
    const latexExpressions = [];
    content = content.replace(/(\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|\\\(.*?\\\))/g, (match) => {
      latexExpressions.push(match);
      return `<<LATEX_${latexExpressions.length - 1}>>`;
    });
  
    // Step 3: Escape dollar signs that are likely currency indicators
    content = content.replace(/\$(?=\d)/g, '\\$');
  
    // Step 4: Restore LaTeX expressions
    content = content.replace(/<<LATEX_(\d+)>>/g, (_, index) => latexExpressions[parseInt(index)]);
  
    // Step 5: Restore code blocks
    content = content.replace(/<<CODE_BLOCK_(\d+)>>/g, (_, index) => codeBlocks[parseInt(index)]);
  
    // Step 6: Apply additional escaping functions
    content = escapeBrackets(content);
    content = escapeMhchem(content);
  
    return content;
}

function escapeBrackets(text) {
  const pattern = /(```[\S\s]*?```|`.*?`)|\\\[([\S\s]*?[^\\])\\]|\\\((.*?)\\\)/g;
  return text.replace(
    pattern,
    (match, codeBlock, squareBracket, roundBracket) => {
      if (codeBlock != null) {
        return codeBlock;
      } else if (squareBracket != null) {
        return `$$${squareBracket}$$`;
      } else if (roundBracket != null) {
        return `$${roundBracket}$`;
      }
      return match;
    }
  );
}

function escapeMhchem(text) {
  return text.replaceAll('$\\ce{', '$\\\\ce{').replaceAll('$\\pu{', '$\\\\pu{');
}

const gptResponse = async (chatHistory) => {
    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: chatHistory,
            temperature: 0,
        })
        return response.choices[0].message.content.trim()
    } catch (error) {
        console.error("Error in fetching response from OpenAI API", error);
    }    
}

const topicClassifier = async (input) => {
    const prompt = `You are an expert in machine learning. Given the following user query relating to building a maching learning system, analyze the query whether it is related to machine learning and determine its topic.
        User Query: "${input}"
        Choose one of the following topics:
        - Problem Description
        - Dataset Description
        - Metrics Explanation
        - Other
        Return only the topic name, without additional explanation.
    `
    const response = await gptResponse([{role: "user", content: prompt}])
    return response
}

const ClearHistory = async (req, res) => {
    try {
        const projectCreated = req.body.projectCreated
        if (projectCreated) {
            let jsonObject = JSON.parse(jsonSumm)
            delete jsonObject.project_name
			jsonObject.project_task = ""
            jsonObject.project_summary = ""
            jsonSumm = JSON.stringify(jsonObject)
            await SaveChatHistory(req, chatHistory, jsonSumm)
            res.json({ message: "JSON project content cleared." });
        } else {
            await SaveChatHistory(req, [], "")
            res.json({ message: "Chat history cleared." });
        }

    } catch (error) {
        res.status(500).json({ error: "Failed to clear chat history." });
    }
};

const SaveChatHistory = async (req, _chatHistory = [], _jsonSumm = "") => {
    try {
        const { _id } = req.user;
        await User.updateOne({ _id }, { chatHistory: _chatHistory, jsonSumm: _jsonSumm });
        return "Chat history saved.";
    } catch (error) {
        console.error("Error saving chat history:", error);
        throw new Error("Failed to save chat history.");
    }
};

const GetChatHistory = async (req, res) => {
    const {_id} = req.user
    const user = await User.findById(_id)
    const _user = user.toObject();
    let _chatHistory = []
    let _jsonSumm = ""
    if (user) {
        _chatHistory = _user?.chatHistory;
        _jsonSumm = _user?.jsonSumm;
        if (_chatHistory) {
            chatHistory = _chatHistory
            jsonSumm = _jsonSumm
            _chatHistory = _chatHistory.map(msg => {
                return { ...msg, content: msg.displayMessage };
            });
            
        }
    }
    res.json({chatHistory: _chatHistory, jsonSumm: _jsonSumm})
}

const JsonParser = (text) => {
    const regex = /```###json(.*?)```/s;
    const match = text.match(regex, "");
    let jsonContent = ""
    let responseText = ""
    if (match) {
        jsonContent = match[1].replace("\n", "").trim();
        responseText = text.replace(regex, "");
    }
    return { jsonContent, responseText }
};


const ChatbotController = {
    Chat,
    ClearHistory,
    GetChatHistory
}

export default ChatbotController;