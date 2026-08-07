# Text-to-Speech API Comparison (2025–2026)

## For a Chrome MV3 Extension (100–300 words per card / Q&A)

This report compares the five major cloud TTS APIs against the criteria that matter for your use case:

- API pricing
- Native word-level timestamps/alignment
- Streaming input (incremental text)
- Free tier
- Overall suitability

---

# Executive Summary

| Provider             |                               Lowest API Price | Native Word Timestamps       | Streaming Text Input              | Free Tier              | Overall            |
| -------------------- | ---------------------------------------------: | ---------------------------- | --------------------------------- | ---------------------- | ------------------ |
| **Google Cloud TTS** |                                 **$4/M chars** | ❌ No                        | ❌ No                             | Yes                    | Best budget option |
| **AWS Polly**        |                                 **$4/M chars** | ✅ Yes (Speech Marks)        | ❌ No                             | Yes                    | Best value overall |
| **OpenAI TTS**       |                                **$15/M chars** | ❌ No                        | ❌ No (audio output streams only) | No permanent free tier | Very easy API      |
| **Azure AI Speech**  |                                **$16/M chars** | ✅ Yes (WordBoundary events) | ❌ No                             | Yes                    | Enterprise-grade   |
| **ElevenLabs API**   | **$50/M (Flash)**<br>**$100/M (Multilingual)** | ✅ Yes                       | ✅ Yes                            | Yes                    | Best feature set   |

---

# 1. ElevenLabs API

## Pricing

The current API is **usage-based**, not credit-only.

Official API pricing:

| Model              |                                   Price |
| ------------------ | --------------------------------------: |
| Flash / Turbo      |  **$0.05 per 1,000 characters** ($50/M) |
| Multilingual v2/v3 | **$0.10 per 1,000 characters** ($100/M) |

API usage is billed directly in USD, with monthly included quotas depending on your subscription plan. ([ElevenLabs][1])

---

## Native alignment

**Yes.**

This is one of ElevenLabs' strongest features.

The API can return:

- character alignment
- word alignment
- timestamps

These are produced directly during synthesis.

No Whisper or forced alignment is required.

---

## Streaming input

**Yes.**

ElevenLabs exposes a WebSocket streaming endpoint specifically designed for conversational AI.

You can:

- send text chunks
- continue sending more text
- receive audio before all text has arrived

Among the providers in this comparison, ElevenLabs is the only one with mature support for true incremental text streaming. ([ElevenLabs][1])

---

## Free tier

Yes.

Current free API allowance is approximately:

- 20k Flash/Turbo characters
- or 10k Multilingual characters/month

depending on the model. ([ElevenLabs][1])

---

## Pros

- Highest-quality voices
- Native timestamps
- Streaming text input
- Excellent multilingual support
- Voice cloning

## Cons

- Most expensive API in this comparison

---

# 2. OpenAI TTS

## Pricing

Current pricing:

| Model    |           Price |
| -------- | --------------: |
| tts-1    | **$15/M chars** |
| tts-1-hd | **$30/M chars** |

([CostGoat][2])

---

## Native alignment

**No.**

The API returns audio only.

No:

- word timestamps
- speech marks
- alignment metadata

If synchronized highlighting is needed, a second alignment pass is required.

---

## Streaming input

**No.**

Important distinction:

OpenAI supports:

- streaming audio output

But the text itself must be supplied as a complete request.

You cannot continue sending text while synthesis is already occurring.

---

## Free tier

No permanent API free tier.

New API accounts may receive promotional credits, but there is no ongoing monthly free allowance. ([CostGoat][2])

---

## Pros

- Very simple API
- Good voice quality
- Competitive pricing

## Cons

- No timestamps
- No incremental streaming input

---

# 3. Azure AI Speech (Cognitive Services)

## Pricing

Neural voices:

**$16/M characters**

Pricing varies by voice family, but Neural voices are approximately this cost. ([Deepgram][3])

---

## Native alignment

**Yes.**

Azure emits:

- WordBoundary events
- Sentence boundaries
- Viseme events

These are generated directly during synthesis.

---

## Streaming input

**No.**

Azure supports streaming audio output but requires the full text before synthesis starts.

---

## Free tier

Yes.

Azure includes a monthly free quota for Speech services (subject to Azure account limits and regional availability). ([Deepgram][3])

---

## Pros

- Excellent enterprise API
- Native timestamps
- Viseme support
- Large language coverage

## Cons

- No streaming text input

---

# 4. Google Cloud Text-to-Speech

## Pricing

| Voice    |           Price |
| -------- | --------------: |
| Standard |  **$4/M chars** |
| WaveNet  |  **$4/M chars** |
| Neural2  | **$16/M chars** |

Google bills by characters synthesized. ([Google Cloud][4])

---

## Native alignment

**No.**

The API does not return word timing or speech marks.

Developers needing synchronized highlighting must perform forced alignment separately.

---

## Streaming input

**No.**

Entire text must be submitted before synthesis begins.

---

## Free tier

Permanent monthly free tier:

- 4M Standard/WaveNet characters
- 1M+ free quotas for selected newer voice families (varies by model)

before billing begins. ([Google Cloud][4])

---

## Pros

- Cheapest high-quality API
- Excellent reliability
- Huge infrastructure

## Cons

- No timestamps
- No streaming input

---

# 5. AWS Polly

## Pricing

Official pricing:

| Voice      |            Price |
| ---------- | ---------------: |
| Standard   |   **$4/M chars** |
| Neural     |  **$16/M chars** |
| Generative |  **$30/M chars** |
| Long-form  | **$100/M chars** |

([AI Pricing Guru][5])

---

## Native alignment

**Yes.**

Polly provides **Speech Marks**, including:

- word timestamps
- sentence timestamps
- viseme timing

These are generated directly by the synthesis engine.

---

## Streaming input

**No.**

Like Azure and Google:

- audio may stream back
- text must be complete before synthesis begins

---

## Free tier

For the first 12 months:

- 5M Standard characters/month
- 1M Neural characters/month

After that, standard usage pricing applies. ([AI Pricing Guru][5])

---

## Pros

- Cheapest API with timestamps
- Mature AWS service
- Excellent documentation

## Cons

- No streaming text input

---

# Feature Comparison

| Feature                | ElevenLabs | OpenAI |  Azure  | Google  | AWS Polly |
| ---------------------- | :--------: | :----: | :-----: | :-----: | :-------: |
| Native timestamps      |     ✅     |   ❌   |   ✅    |   ❌    |    ✅     |
| Word highlighting      |     ✅     |   ❌   |   ✅    |   ❌    |    ✅     |
| Streaming text input   |     ✅     |   ❌   |   ❌    |   ❌    |    ❌     |
| Streaming audio output |     ✅     |   ✅   |   ✅    |   ✅    |    ✅     |
| Voice cloning          |     ✅     |   ❌   | Limited | Limited |  Limited  |
| Cheapest model         |   $50/M    | $15/M  |  $16/M  |  $4/M   |   $4/M    |

---

# Estimated Monthly Cost

Assuming:

- 200-word average card
- ~1,250 characters
- 10,000 cards/month

≈ **12.5 million characters/month**

| Provider                | Estimated Cost |
| ----------------------- | -------------: |
| Google Standard         |       **~$50** |
| AWS Polly Standard      |       **~$50** |
| OpenAI tts-1            |      **~$188** |
| Azure Neural            |      **~$200** |
| AWS Polly Neural        |      **~$200** |
| ElevenLabs Flash        |      **~$625** |
| ElevenLabs Multilingual |    **~$1,250** |

---

# Recommendations for Your Chrome MV3 Extension

Based on your requirements—100–300 word educational cards and Q&A responses—the providers fall into distinct categories:

- **Best overall balance:** **AWS Polly**. It combines the lowest pricing with native word-level timing via Speech Marks, making it ideal if you want synchronized text highlighting without expensive post-processing.
- **Best premium experience:** **ElevenLabs**. It is the only provider in this comparison that offers both native alignment metadata and true incremental text streaming, making it especially attractive if your text is generated by an LLM in real time. The trade-off is significantly higher cost.
- **Best budget option:** **Google Cloud TTS**. It offers the lowest character pricing and a generous permanent free tier, but lacks native timing metadata.
- **Best enterprise platform:** **Azure AI Speech**. It provides robust timing events, viseme support, and broad language coverage, making it a strong choice for production applications that need rich synchronization features.
- **Best for simple integrations:** **OpenAI TTS**. The API is straightforward and competitively priced, but it does not return word-level timing metadata and requires the complete text before synthesis begins.

For your specific use case, if **word-by-word highlighting is a core feature**, the shortlist narrows to **AWS Polly**, **Azure AI Speech**, and **ElevenLabs**. If **streaming text from an LLM while audio is already being synthesized** is also a requirement, **ElevenLabs is currently the only provider among these five that supports that workflow natively.**

[1]: https://elevenlabs.io/pricing/api?utm_source=chatgpt.com "ElevenAPI Pricing for creators and businesses of all sizes"
[2]: https://costgoat.com/pricing/openai-tts?utm_source=chatgpt.com "OpenAI TTS API Pricing Calculator (Jul 2026)"
[3]: https://deepgram.com/learn/best-text-to-speech-apis-2026?utm_source=chatgpt.com "10 Best Text to Speech APIs in 2025: Pricing, Features & ..."
[4]: https://cloud.google.com/text-to-speech/pricing?utm_source=chatgpt.com "Review pricing for Text-to-Speech"
[5]: https://www.aipricing.guru/ai-voice-tts-api-pricing/?utm_source=chatgpt.com "AI Voice & TTS API Pricing: ElevenLabs, Speechify, OpenAI"

# Final Report: Open-Source Local TTS for a Chrome MV3 Extension (Mid-2025)

## Requirements

The target solution should ideally satisfy all of the following:

- ✅ Runs completely offline
- ✅ Either:
  - directly inside Chrome (WebAssembly/WebGPU/ONNX/Transformers.js), **or**
  - on the user's own PC as a lightweight local service (no cloud)

- ✅ High-quality natural voices
- ✅ Runs well on ordinary consumer laptops (CPU-first, GPU optional)
- ✅ Provides **word-level timestamps** (or exposes enough alignment information to generate them)
- ✅ Suitable for synchronized word highlighting while reading

---

# Executive Summary

After researching the current open-source ecosystem, there is a clear winner.

| Solution                        | Recommendation                         |
| ------------------------------- | -------------------------------------- |
| **Kokoro**                      | ⭐⭐⭐⭐⭐ Strongly recommended        |
| Piper                           | ⭐⭐⭐⭐ Great desktop fallback        |
| Coqui XTTS                      | ⭐⭐⭐ Excellent quality but too heavy |
| Chatterbox                      | ⭐⭐ Research project, not practical   |
| Fish Speech / IndexTTS / others | ⭐⭐ Too large for consumer deployment |

The biggest surprise during this research was discovering that **Kokoro actually supports timestamps internally**—the limitation is primarily in the JavaScript API rather than the model itself. There is also a timestamp-enabled ONNX distribution specifically designed to expose alignment data. ([Hugging Face][1])

---

# Detailed Evaluation

## 1. Kokoro ⭐⭐⭐⭐⭐ (Recommended)

### Overall Verdict

This is currently the strongest candidate for your extension.

It is:

- lightweight
- fast
- open source
- browser-capable
- CPU-friendly
- natural sounding
- capable of producing timestamps

No other open-source model checks as many boxes simultaneously.

---

## Model Size

Base model:

- 82 million parameters

Typical downloads:

| Format    | Approximate Size |
| --------- | ---------------- |
| FP32      | ~300–325 MB      |
| FP16      | ~170–180 MB      |
| INT8 / Q8 | ~80–95 MB        |

Quantized versions load dramatically faster and require much less RAM while preserving voice quality. ([GitHub][2])

---

## Browser Support

Excellent.

Runs completely inside Chrome using:

- ONNX Runtime Web
- Transformers.js
- WebAssembly
- WebGPU (when available)

No Python.

No server.

No backend.

Everything stays on the user's machine. ([Hugging Face][1])

---

## Consumer Hardware

Excellent.

Works well on:

- Intel laptops
- AMD laptops
- Apple Silicon
- Mini PCs

Dedicated GPU is **not required**.

GPU acceleration simply makes inference faster.

This is one of Kokoro's biggest advantages.

---

## Voice Quality

Outstanding for its size.

Community consensus generally places it among the best lightweight open-source TTS models available.

Pros:

- natural pacing
- pleasant voices
- expressive
- not robotic

Cons:

- smaller voice library than commercial APIs
- English voices remain the strongest

---

# Timestamp Support (Important)

This was the main focus of the follow-up research.

### Initial assumption

Originally it appeared Kokoro did **not** support timestamps.

That turns out to be incorrect.

---

### Reality

Internally, Kokoro predicts **phoneme durations**.

Those durations can be converted into:

- phoneme timestamps
- word timestamps
- subtitle timing
- karaoke highlighting

The model itself already contains this information.

---

## Python

Python exposes timing-related data directly.

You can obtain alignment information during synthesis without performing forced alignment afterward. ([ryanwelch.co.uk][3])

---

## JavaScript

The current public JavaScript API does **not** expose those alignment tensors.

Instead it mainly returns:

- generated audio
- streamed text chunks

So today's JS libraries require approximating timings or extending the runtime. ([ryanwelch.co.uk][3])

---

## Timestamp-enabled ONNX Model

This is the most exciting discovery.

There is now an official community model:

**Kokoro-82M-v1.0-ONNX-timestamped**

Its purpose is specifically to expose timing information.

Developers are actively discussing:

- phoneme timestamps
- token timestamps
- word timestamps
- extracting durations

There are working examples showing how to retrieve them. ([Hugging Face][1])

---

## Can it be extended?

Yes.

This is probably the biggest engineering opportunity.

Since the duration tensors already exist inside the ONNX graph, a custom browser runtime (or a fork of `kokoro-js`) could expose an API like:

```ts
{
  audio,
  words: [
    { word: "Hello", start: 0.00, end: 0.42 },
    { word: "world", start: 0.42, end: 0.88 }
  ]
}
```

This would eliminate the need for external forced alignment.

---

# 2. Piper ⭐⭐⭐⭐

## Strengths

Piper remains one of the best lightweight native TTS engines.

Pros:

- extremely fast
- tiny models
- CPU-friendly
- mature
- excellent for desktop deployment

Runs comfortably on:

- Raspberry Pi
- office laptops
- Intel NUC
- Windows PCs

---

## Browser

Weak.

There is no mature browser-first implementation comparable to Kokoro.

---

## Local Server

Excellent.

This is probably Piper's strongest deployment model.

A tiny local HTTP service can expose TTS to your extension with minimal overhead.

---

## Voice Quality

Very good.

Better than eSpeak.

Not quite as expressive as Kokoro.

---

## Timestamp Support

No native word timestamps.

No exposed alignment API.

Timing would need to be estimated or obtained via a separate aligner.

---

# 3. Coqui XTTS

## Voice Quality

Excellent.

Among the best open-source voices.

Supports:

- multilingual speech
- voice cloning
- expressive narration

---

## Hardware

Much heavier.

Usually benefits greatly from GPU acceleration.

Runs on CPU, but inference is substantially slower.

---

## Browser

Not practical.

---

## Timestamp Support

No built-in word timestamps.

---

# 4. Chatterbox

Very impressive research.

Excellent speech quality.

However:

- multi-gigabyte models
- Python
- GPU preferred
- unsuitable for browser inference

No timestamp API.

---

# 5. Other Models

Projects such as Fish Speech, IndexTTS, StyleTTS2, and similar next-generation TTS systems produce very natural speech, but they are generally optimized for high-end local AI setups rather than lightweight desktop applications. They are significantly larger, have higher hardware requirements, and do not provide a simple browser deployment story with exposed word timing.

---

# A Newly Discovered Alternative: HeadTTS

One particularly interesting project that emerged during this research is **HeadTTS**.

Unlike most wrappers, it is built on Kokoro and already exposes:

- phoneme timestamps
- visemes (mouth shapes)
- browser execution
- WebGPU
- WASM fallback
- optional local Node.js server

In other words, someone has already demonstrated that Kokoro's timing information can be surfaced successfully in a browser-oriented implementation. ([GitHub][4])

This is significant because it validates that browser-based timing is technically achievable today.

---

# Performance on Consumer Hardware

| Model       | CPU        | GPU Needed? | Consumer Laptop |
| ----------- | ---------- | ----------- | --------------- |
| Kokoro      | Excellent  | No          | ⭐⭐⭐⭐⭐      |
| Piper       | Excellent  | No          | ⭐⭐⭐⭐⭐      |
| XTTS        | Acceptable | Recommended | ⭐⭐⭐          |
| Chatterbox  | Poor       | Yes         | ⭐⭐            |
| Fish Speech | Poor       | Yes         | ⭐              |

---

# Best Architecture Options

## Option A — Pure Browser (Recommended)

```
Chrome Extension

↓

Kokoro ONNX

↓

WebGPU / WASM

↓

Audio + timestamps

↓

Word highlighting
```

Advantages:

- no installation
- no backend
- fully offline
- privacy-friendly

---

## Option B — Desktop Companion

```
Chrome Extension

↓

localhost

↓

Piper or Kokoro

↓

Audio + timestamps

↓

Highlighting
```

Advantages:

- lower browser memory usage
- easier integration with native APIs
- can support larger models

---

# Final Recommendation

After the second round of research, my recommendation is even stronger than before.

## Primary Recommendation

Build around **Kokoro**.

Specifically:

- use the ONNX implementation
- use quantized models (Q8/INT8) by default for faster downloads and lower memory usage
- investigate the **timestamp-enabled ONNX** build
- expose the duration tensors through a custom JavaScript wrapper if the current API does not already return them

This approach offers the best combination of:

- browser compatibility
- excellent voice quality
- CPU performance
- small download size
- offline execution
- commercial-friendly licensing
- genuine timing information suitable for synchronized word highlighting. ([Hugging Face][1])

## Secondary Recommendation

Offer **Piper** as an optional desktop companion for users who prefer a local service or have environments where browser inference is undesirable. It is lightweight and extremely CPU-efficient, though it lacks native timestamp support.

## Overall Conclusion

As of **mid-2025**, **Kokoro occupies a unique position** in the open-source TTS ecosystem. It is one of the very few models that simultaneously provides:

- high-quality neural voices,
- practical CPU performance on ordinary consumer hardware,
- browser execution via ONNX/WebAssembly/WebGPU,
- and access to native timing information through its duration predictions.

The only notable gap is that the mainstream JavaScript API has not yet fully exposed those alignment outputs. However, the existence of the **timestamp-enabled ONNX model** and projects like **HeadTTS** demonstrates that this is an implementation limitation rather than a limitation of the model itself, making Kokoro the strongest foundation currently available for an offline Chrome extension with synchronized word highlighting. ([Hugging Face][1])

[1]: https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX-timestamped?utm_source=chatgpt.com "onnx-community/Kokoro-82M-v1.0-ONNX-timestamped"
[2]: https://github.com/thewh1teagle/kokoro-onnx?utm_source=chatgpt.com "TTS with kokoro and onnx runtime"
[3]: https://ryanwelch.co.uk/blog/kokoro-word-timestamps/?utm_source=chatgpt.com "Kokoro for TTS and word timestamps - Ryan Welch"
[4]: https://github.com/met4citizen/HeadTTS?utm_source=chatgpt.com "HeadTTS: Free neural text-to-speech ..."
