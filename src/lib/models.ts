import { AIModel } from "../types";

export const AVAILABLE_MODELS: AIModel[] = [
  {
    id: "meta/llama-3.3-70b-instruct",
    name: "Llama 3.3 70B",
    provider: "NVIDIA",
    description: "Meta's state-of-the-art 70B model hosted on NVIDIA NIM. Exceptional multilingual performance, structured explanations, coding mastery, and swift speeds.",
    badge: "Flagship 3.3",
    maxTokens: 4096,
    isVision: false,
  },
  {
    id: "nvidia/llama-3.1-nemotron-70b-instruct",
    name: "Nemotron 3.1 70B",
    provider: "NVIDIA",
    description: "NVIDIA's custom-tuned Llama model. Excels at highly helpful, beautiful markdown outputs, rich structured explanations, and programming support.",
    badge: "Specially Tuned",
    maxTokens: 4096,
    isVision: false,
  },
  {
    id: "meta/llama-3.1-405b-instruct",
    name: "Llama 3.1 405B",
    provider: "NVIDIA",
    description: "Meta's flagship open LLM hosted by NVIDIA NIM. Massive reasoning, perfect for deep research, coding, logic trees, or complex summarization.",
    badge: "Maximum Reasoning",
    maxTokens: 4096,
    isVision: false,
  },
  {
    id: "mistralai/mixtral-8x22b-instruct-v0.1",
    name: "Mixtral 8x22B",
    provider: "NVIDIA",
    description: "Powerful Mixture of Experts (MoE) engineered by Mistral AI. Optimized for heavy logical parsing, formatting, and high density analytics.",
    badge: "Logical Specialist",
    maxTokens: 4096,
    isVision: false,
  },
  {
    id: "microsoft/phi-3-medium-128k-instruct",
    name: "Phi-3 Medium",
    provider: "NVIDIA",
    description: "Microsoft's lightweight yet state-of-the-art model. Incredibly resource-efficient and snappy for straightforward tasks.",
    badge: "Lightweight & Fast",
    maxTokens: 2048,
    isVision: false,
  },
];
