# Image output terms: OpenAI GPT Image models

Date read: 2026-11-25

## Sources

- https://openai.com/policies/services-agreement/ (OpenAI Services Agreement, the business and API terms. Page says Updated: December 1, 2025, Effective: January 1, 2026)
- https://openai.com/policies/terms-of-use/ (consumer Terms of Use. Page says Published: January 1, 2026, Effective: January 1, 2026)
- https://openai.com/policies/usage-policies/ (Usage Policies. Page says Effective: November 20, 2026)
- https://openai.com/policies/service-terms/ (Service Terms. Page says Updated: November 13, 2026)
- https://openai.com/policies/sharing-publication-policy/ (Sharing and publication policy. Page says Updated: November 14, 2022)
- https://help.openai.com/en/articles/8912793-c2pa-in-chatgpt-images (Help Center article, Provenance signals in OpenAI-generated content. Page says Updated: 2 days ago)
- https://www.perplexity.ai/hub/legal/third-party-models (Perplexity list of third party model terms, which names openai.com/policies/business-terms and openai.com/policies/usage-policies for GPT models)

## Notes on reading

- The images are made through the image tool of Perplexity Computer, so the direct OpenAI customer is Perplexity, not this project. The OpenAI terms below describe what OpenAI gives its customer. What Perplexity passes on is in images-perplexity.md.
- The Usage Policies and Service Terms pages were fetched and searched for the words watermark, provenance, commercial and human-generated. No sentence on those points was found in them, apart from the Service Terms section on image inputs, which is about inputs, not outputs.
- The Help Center article is a help page, not a contract.

## (a) Who owns the output

- "As between Customer and OpenAI, to the extent permitted by applicable law, Customer: (a) retains all ownership rights in Input; and (b) owns all Output. OpenAI hereby assigns to Customer all OpenAI’s right, title, and interest, if any, in and to Output."
  Source: https://openai.com/policies/services-agreement/

- "As between you and OpenAI, and to the extent permitted by applicable law, you (a) retain your ownership rights in Input and (b) own the Output. We hereby assign to you all our right, title, and interest, if any, in and to Output."
  Source: https://openai.com/policies/terms-of-use/

## (b) Commercial use

- No sentence was found in the Services Agreement, the Terms of Use or the Usage Policies that says in so many words that Output may be used commercially. The ownership and assignment sentences above are the only grant.

## (c) Restrictions that touch a published video or a public website

- "What you cannot do. You may not use our Services for any illegal, harmful, or abusive activity. For example, you may not:"
  Source: https://openai.com/policies/terms-of-use/

- "Represent that Output was human-generated when it was not."
  Source: https://openai.com/policies/terms-of-use/

- "Posting your own prompts or completions to social media is generally permissible, as is livestreaming your usage or demonstrating our products to groups of people. Please adhere to the following:"
  Source: https://openai.com/policies/sharing-publication-policy/

- "Manually review each generation before sharing or while streaming."
  Source: https://openai.com/policies/sharing-publication-policy/

- "Attribute the content to your name or your company."
  Source: https://openai.com/policies/sharing-publication-policy/

- "Indicate that the content is AI-generated in a way no user could reasonably miss or misunderstand."
  Source: https://openai.com/policies/sharing-publication-policy/

- Note: the Sharing and publication policy is dated November 14, 2022 and its words are about prompts, completions and written content. Whether it binds an image used as a texture is not said on the page.

## (d) Watermark, provenance mark, attribution

- "Images generated with ChatGPT or the OpenAI API include both signals."
  Source: https://help.openai.com/en/articles/8912793-c2pa-in-chatgpt-images

- In the table on that page the row for Images lists the provenance signals as "Content Credentials and SynthID watermarks". Source: https://help.openai.com/en/articles/8912793-c2pa-in-chatgpt-images

- "Coverage may vary by product, model, export path, file type, and when the content was created. API outputs are covered except for models planned for imminent deprecation, including gpt-image-1, gpt-image-1.5, and sora-2."
  Source: https://help.openai.com/en/articles/8912793-c2pa-in-chatgpt-images

- "Metadata can carry detailed information, but platforms, editing tools, and file conversions may remove it."
  Source: https://help.openai.com/en/articles/8912793-c2pa-in-chatgpt-images

## Conclusion

- Ownership of outputs: STATED. "Customer: (a) retains all ownership rights in Input; and (b) owns all Output. OpenAI hereby assigns to Customer all OpenAI’s right, title, and interest, if any, in and to Output." The Customer here is the party that holds the OpenAI API account.
- Published video: not clearly allowed. UNKNOWN. The terms give ownership of Output but no quoted sentence names commercial use, video or publication of image output. No quoted sentence forbids it.
- Public website: not clearly allowed. UNKNOWN. Same reason as for video.
- Watermark or attribution duty: STATED in part. The Terms of Use say you may not "Represent that Output was human-generated when it was not." The help page says "Images generated with ChatGPT or the OpenAI API include both signals." (Content Credentials and SynthID watermarks), with gpt-image-1 and gpt-image-1.5 named as exceptions. A duty to show a visible credit for image output on a website or in a video is UNKNOWN: the only attribution sentences found are in the 2022 Sharing and publication policy, quoted above.
