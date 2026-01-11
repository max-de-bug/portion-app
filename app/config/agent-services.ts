import { Globe, ImageIcon, MessageSquare, Mic, Search, Cpu } from "lucide-react";

export interface AIService {
  id: string;
  name: string;
  pricePerCall: number;
  description: string;
  icon: any;
  category: "text" | "image" | "audio" | "search";
}

export const AI_SERVICES: AIService[] = [
  {
    id: "gpt-4",
    name: "GPT-4",
    pricePerCall: 0.03,
    description: "Advanced reasoning and complex problem solving.",
    icon: MessageSquare,
    category: "text",
  },
  {
    id: "gpt-4-turbo",
    name: "GPT-4 Turbo",
    pricePerCall: 0.01,
    description: "Fast, efficient responses for daily tasks.",
    icon: Cpu,
    category: "text",
  },
  {
    id: "claude-3",
    name: "Claude 3",
    pricePerCall: 0.025,
    description: "Nuanced conversation and technical writing.",
    icon: MessageSquare,
    category: "text",
  },
  {
    id: "dall-e-3",
    name: "DALL-E 3",
    pricePerCall: 0.04,
    description: "High-quality image generation from text.",
    icon: ImageIcon,
    category: "image",
  },
  {
    id: "whisper",
    name: "Whisper",
    pricePerCall: 0.006,
    description: "Accurate audio transcription and translation.",
    icon: Mic,
    category: "audio",
  },
  {
    id: "web-search",
    name: "Web Search",
    pricePerCall: 0.005,
    description: "Real-time web search and data extraction.",
    icon: Globe,
    category: "search",
  },
];
