import { Router } from "express";
import ChatbotController from "../../controllers/chatbot.controller.js";

const chatbotRouter = Router();

chatbotRouter.post("/", ChatbotController.Chat);
chatbotRouter.post("/clear", ChatbotController.ClearHistory);
chatbotRouter.post("/getHistory", ChatbotController.GetChatHistory);

export default chatbotRouter;
