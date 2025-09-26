type ExtractVariables<T extends string> =
  T extends `${string}{${infer Param}}${infer Rest}`
    ? Param | ExtractVariables<Rest>
    : never;

type InferVariables<T extends string> = {
  [K in ExtractVariables<T>]: string;
};

class PromptTemplate<T extends string> {
  constructor(private template: T) {}

  compile(variables: InferVariables<T>): string {
    let result = this.template as string;
    (Object.entries(variables) as [ExtractVariables<T>, string][]).forEach(
      ([key, value]) => {
        result = result.replace(new RegExp(`\\{${key}\\}`, "g"), value);
      }
    );
    return result;
  }
}

const createPrompt = <T extends string>(template: T) => {
  return new PromptTemplate(template);
};

const prompts = {
  optimizeImage:
    createPrompt(`Optimize and enhance the prompts provided for image generation to ensure that Midjourney or other diffusion models can generate excellent views.

-You should provide a detailed and accurate description of the prompt view. If the provided prompt is too simple, you should add some additional details to enrich it and improve the expression of the image content. If necessary, you can use some famous IP names.
-Introduce the topic with higher weights. Avoid using introductory phrases such as' this image displays' or 'on-site'. Avoid using terms that describe cultural values or spirits, such as "creating an xxx atmosphere" or "enhancing the xxx scene".
-Avoid ambiguous expressions and focus only on describing the scene you see in clear and specific terms. Avoid over interpreting abstract or indescribable elements.
-When there are spelling or grammar errors in the input content, you should correct them to improve the accuracy of the prompts.
-Translate input content into accurate and natural sounding English, regardless of the original language.

Input content:<text>
{input}
</text>

Always return results in plain text format and do not add any other content.`),

  // Function to handle custom optimization prompts or use the default
  getOptimizePrompt: (customPrompt?: string) => {
    if (customPrompt) {
      return createPrompt(`${customPrompt}
Always return results in plain text format and do not add any other content.`);
    }
    return prompts.optimizeImage;
  },

  // 示例：多变量模板
  customPrompt: createPrompt(
    `Create a {style} image of {subject} with {mood} mood, using {technique} technique.`
  ),
} as const;

export type Prompts = typeof prompts;
export default prompts;
