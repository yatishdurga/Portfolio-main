// ─────────────────────────────────────────────────────────────────────────────
// HOW TO ADD A NEW ENTRY
// ─────────────────────────────────────────────────────────────────────────────
//
//  DAILY LOG  →  add an object to DAILY_LOG (newest first)
//  INTERVIEW  →  add an object to INTERVIEW_QA (grouped by category)
//  RESEARCH   →  add an object to RESEARCH
//
//  Then save the file — that's it, no HTML needed.
// ─────────────────────────────────────────────────────────────────────────────

const DAILY_LOG = [
  {
    date: "2026-05-19",
    topic: "QLoRA — Quantized Low-Rank Adaptation",
    category: "LLMs",
    tags: ["fine-tuning", "quantization", "transformers"],
    summary: "QLoRA makes fine-tuning large language models possible on consumer hardware by combining 4-bit NF4 quantization with Low-Rank Adapters. Only the adapter weights are trained, so VRAM drops from ~80 GB to ~16 GB for a 65B model.",
    keyPoints: [
      "NF4 (4-bit NormalFloat) preserves the normal distribution of weights better than INT4",
      "Double quantization further compresses constants — saves ~0.37 bits/param",
      "Paged optimizers (via NVIDIA unified memory) prevent OOM spikes during gradient steps",
      "Adapter layers are merged back into the base model at inference — zero latency overhead"
    ],
    resources: [
      { label: "QLoRA Paper (Dettmers et al.)", url: "https://arxiv.org/abs/2305.14314" },
      { label: "Hugging Face PEFT docs", url: "https://huggingface.co/docs/peft" }
    ]
  }
];

// ─────────────────────────────────────────────────────────────────────────────

const INTERVIEW_QA = [
  {
    category: "Machine Learning",
    items: [
      {
        q: "What is the bias-variance tradeoff?",
        a: "Bias is error from wrong assumptions (underfitting). Variance is error from sensitivity to training data (overfitting). Reducing one usually increases the other. The goal is the sweet spot of low total error on unseen data — achieved through regularisation, cross-validation, and the right model complexity."
      },
      {
        q: "Explain gradient descent and its variants.",
        a: "Gradient descent minimises a loss function by iteratively moving parameters in the direction of the steepest descent (negative gradient). Batch GD uses the full dataset — stable but slow. Stochastic GD (SGD) uses one sample — fast but noisy. Mini-batch GD is the practical middle ground. Adam combines momentum and RMSProp for adaptive per-parameter learning rates."
      }
    ]
  },
  {
    category: "SQL & Data Engineering",
    items: [
      {
        q: "What is the difference between RANK(), DENSE_RANK(), and ROW_NUMBER()?",
        a: "ROW_NUMBER() gives a unique sequential integer regardless of ties. RANK() assigns the same rank to ties but skips numbers after (1,1,3). DENSE_RANK() assigns the same rank to ties without skipping (1,1,2). Use RANK/DENSE_RANK for leaderboards, ROW_NUMBER for deduplication."
      },
      {
        q: "When would you use a Star schema vs Snowflake schema?",
        a: "Star schema: denormalised dimensions, simpler queries, faster reads — ideal for BI/analytics. Snowflake schema: normalised dimensions, less storage, more joins — better when storage cost matters or data integrity is critical. In practice most modern data warehouses (BigQuery, Redshift) favour Star or wide flat tables because storage is cheap and joins are expensive at scale."
      }
    ]
  },
  {
    category: "GenAI & LLMs",
    items: [
      {
        q: "What is RAG (Retrieval-Augmented Generation) and why use it?",
        a: "RAG grounds an LLM's output in external, up-to-date documents. A retriever (vector similarity search) fetches relevant chunks; the generator conditions on those chunks. Benefits: reduces hallucination, enables domain-specific knowledge without retraining, keeps context fresh. Key tradeoff vs fine-tuning: RAG is cheaper to update (swap the index) but adds retrieval latency."
      }
    ]
  }
];

// ─────────────────────────────────────────────────────────────────────────────

const RESEARCH = [
  {
    date: "2026-05-19",
    title: "Agentic AI Frameworks — AutoGen vs CrewAI vs LangGraph",
    tags: ["agents", "LLMs", "orchestration"],
    abstract: "Comparing multi-agent orchestration frameworks for building reliable AI pipelines. Focus on control flow, tool use, memory, and production readiness.",
    findings: [
      "AutoGen (Microsoft) excels at conversational multi-agent loops with built-in human-in-the-loop — great for code generation tasks",
      "CrewAI abstracts role-based agents (Researcher, Writer, Reviewer) with minimal boilerplate — fast prototyping",
      "LangGraph gives the most control via explicit state machines — preferred when you need deterministic branching and auditability",
      "All three support function/tool calling; LangGraph + LangSmith has the best observability story for production"
    ],
    status: "In Progress"
  }
];
