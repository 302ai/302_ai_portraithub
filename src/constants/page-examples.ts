export const pageExamples = [
  {
    id: "studio-portrait",
    defaultModel: "doubao-seedream-4-0-250828",
    examples: {
      general: [
        "https://file.302.ai/gpt/imgs/20250919/7cc563f09f85520fe8b40bb5337deb5d.jpg",
        "https://file.302.ai/gpt/imgs/20250919/9e01ac7015d0d9be0371d3e3444bb8ca.jpg",
      ],
    },
    prompt: (params: {
      background_color: string;
      clothing_description: string;
    }) => {
      return `Generate a studio portrait photo for the person in the picture, with ${params.background_color} as the background and ${params.clothing_description} as the clothing. Use side lighting and a composition of a bust`;
    },
    parameters: [
      {
        key: "background_color",
        label: "Background Color",
        type: "color-picker",
        placeholder: "e.g., white, blue, black",
        defaultValue: "#000000",
      },
      {
        key: "clothing_description",
        label: "Clothing Description",
        type: "textarea",
        placeholder: "e.g., formal suit, casual shirt",
      },
    ],
  },
  {
    id: "professional-portrait",
    defaultModel: "gemini-2.5-flash-image-preview",
    examples: {
      "gemini-2.5-flash-image-preview": [
        "https://file.302.ai/gpt/imgs/20250919/b02cd5de195bb38b6a295630aded397f.jpg",
        "https://file.302.ai/gpt/imgs/20250919/f0f1a30e6035df8c5b981698becc2b95.jpg",
      ],
      "doubao-seedream-4-0-250828": [
        "https://file.302.ai/gpt/imgs/20250919/83bdfeea043e6ca7c5c5788df372aebb.jpg",
        "https://file.302.ai/gpt/imgs/20250919/a9bbe315a6d8f5c1a41d4047a38ba648.jpg",
      ],
    },
    prompt: (params: { gender: string }, model: string) => {
      const prompts = {
        "gemini-2.5-flash-image-preview": {
          male: "Generate two professional American-style headshots (in the style of corporate executive photography) from different angles and poses for the person in the uploaded photo. The original photo's facial features and identity must be preserved. Requirements: A bust-up portrait, a textured blue background, natural, soft studio lighting, high-definition clarity, realistic skin tones, and a simple, elegant image. The person should wear a black, slim-fit suit. This simple, elegant design features a straight, slightly tapered fit, and smooth, unpatterned fabric, creating a modern and professional look. Wear a white or light-colored shirt without a tie to accentuate a modern, sophisticated look. Accessorize with simple gold cufflinks or a watch for a modern, professional, and sophisticated look. The expression should be relaxed and confident, with a bright gaze and a natural, toothy smile. The camera should be in sharp focus, with a slightly blurred background, for a professional, refined, and clean look.",
          female:
            "Two professional American-style headshots (in the style of corporate executive photography) are generated for the uploaded image of the subject from different angles and poses. The original subject's facial features and identity must be preserved. Requirements: A bust-length portrait with a textured blue background and natural, soft studio lighting. High-definition clarity, realistic skin tones, and a simple, elegant image. The subject should wear a sleeveless black dress with a simple, elegant design, a straight, slightly fitted silhouette, and smooth, unpatterned fabric. This creates a modern and professional look. Paired with simple gold jewelry, the overall look is modern and sophisticated. The subject's expression should be relaxed and confident, with a bright gaze and a natural, toothy smile. The lens should be in sharp focus with a slightly blurred background, resulting in a professional, refined, and clean look.",
        },
        "doubao-seedream-4-0-250828": {
          male: "Generate a professional American-style headshot (in the style of corporate executive photography) based on the uploaded image of the subject, preserving the subject's facial features and identity. Requirements: A bust-length portrait with a textured blue background, natural, soft studio lighting, high-definition clarity, realistic skin tones, and a simple, elegant image. The subject should wear a black, slim-fit suit with a simple, elegant design, a straight, slightly tapered fit, and smooth, unpatterned fabric, creating a modern and professional look. Wear a white or light-colored shirt without a tie to enhance the modern, sophisticated look. Accessorize with simple gold cufflinks or a watch for a modern, professional, and sophisticated look. The subject's expression should be relaxed and confident, with a bright gaze and a natural, toothy smile. The camera should be in sharp focus with a slightly blurred background, creating a professional, refined, and clean look.",
          female:
            "Generate a professional American-style headshot (in the style of corporate executive photography) based on the uploaded image of the subject, preserving the subject's facial features and identity. Requirements: A bust-up portrait with a textured blue background, natural, soft studio lighting, high-definition clarity, realistic skin tones, and a simple, elegant image. The subject should wear a sleeveless black dress with a simple, elegant design, a straight, slightly fitted silhouette, and smooth, unpatterned fabric, creating a modern and professional look. Paired with simple gold jewelry, the overall look is modern and sophisticated. The subject's expression should be relaxed and confident, with a bright gaze and a natural, toothy smile. The lens should be in sharp focus with a slightly blurred background, results in a professional, refined, and clean look.",
        },
      };
      return (
        prompts[model as keyof typeof prompts]?.[
          params.gender as keyof (typeof prompts)["gemini-2.5-flash-image-preview"]
        ] || ""
      );
    },
    parameters: [
      {
        key: "gender",
        label: "Gender",
        type: "select",
        options: ["male", "female"],
        placeholder: "Select gender",
        defaultValue: "male",
      },
    ],
  },
  {
    id: "id-photo-normal",
    defaultModel: "doubao-seedream-4-0-250828",
    examples: {
      general: [
        "https://file.302.ai/gpt/imgs/20250909/1d8d66788c1c4dc599a3fa6392c3b93d.png",
        "https://file.302.ai/gpt/imgs/20250909/4b53f231ea3d4ffa9a510d832d7e8fad.png",
        "https://file.302.ai/gpt/imgs/20250909/fd18366b7d31481695005d0dcde7d4d0.png",
      ],
    },
    prompt: (params: { photo_size: string; background_color: string }) => {
      const backgroundColorMap = {
        blue: "blue background",
        white: "white background",
        red: "red background",
      };
      const backgroundText =
        backgroundColorMap[
          params.background_color as keyof typeof backgroundColorMap
        ] || "blue background";

      return `
    Capture the head of the portrait in the picture and make it into a ${params.photo_size} ID photo for me. Requirements:
1. ${backgroundText}
2. Professional dress code
3. Front face
4. Smile
    `;
    },
    parameters: [
      {
        key: "photo_size",
        label: "Photo Size",
        type: "select",
        options: [
          "one_inch",
          "two_inch",
          "small_one_inch",
          "small_two_inch",
          "large_one_inch",
          "large_two_inch",
          "five_inch",
        ],
        placeholder: "Select photo size",
        defaultValue: "one_inch",
      },
      {
        key: "background_color",
        label: "Background Color",
        type: "select",
        options: ["blue", "white", "red"],
        placeholder: "Select background color",
        defaultValue: "blue",
      },
    ],
  },
  {
    id: "id-photo-american",
    defaultModel: "doubao-seedream-4-0-250828",
    examples: {
      general: [
        "https://file.302.ai/gpt/imgs/20250915/aedaf0b8b30a4cbdb0c02be0480c3c8a.jpg",
        "https://file.302.ai/gpt/imgs/20250915/9ce5a95b73f67e5f9b996ba861863a5f.jpg",
        "https://file.302.ai/gpt/imgs/20250915/c4eb7618f76153b6fbfb86322ea4d833.jpg",
      ],
    },
    prompt: (params: {
      clothing_description: string;
      other_requirements: string;
    }) => {
      const otherReqs =
        params.other_requirements && params.other_requirements.trim() !== ""
          ? params.other_requirements
          : "none";

      return `Please crop the subject's head from the photo and create a ID photo for me. Requirements:
1. American style, soft gradient dark blue background, natural soft studio lighting, high definition, realistic skin tones, and a simple and elegant image.
2. Clothing: ${params.clothing_description}
3. Front view.
4. Relaxed and confident expression, bright eyes, and a bright smile.
5. Makeup: American freckles, embellished with orange-toned blush and a few freckles, and blush lightly applied across the apples of the cheeks and across the bridge of the nose to create a tanned look.
6. Other requirements: ${otherReqs}`;
    },
    parameters: [
      {
        key: "clothing_description",
        label: "Clothing Description",
        type: "textarea",
        placeholder:
          "e.g., 由浅蓝色领衬衫和深蓝色细条纹外套组成的多层服装，并搭配一条相配的条纹领带",
        defaultValue: "",
      },
      {
        key: "other_requirements",
        label: "Other Requirements",
        type: "textarea",
        placeholder: "Additional requirements (leave empty if none)",
        defaultValue: "",
      },
    ],
  },
  {
    id: "black-and-white-portrait",
    defaultModel: "gemini-2.5-flash-image-preview",
    examples: {
      general: [
        "https://file.302.ai/gpt/imgs/20250915/f65a3a51ad994266ad258ec7e539f918.jpg",
        "https://file.302.ai/gpt/imgs/20250915/d54294e6f9e36cc102d9cce25a771ea6.jpg",
        "https://file.302.ai/gpt/imgs/20250915/8a6a61d3a0f65e8d228aa754b052572e.jpg",
      ],
    },
    prompt: () => {
      return `Generates black and white portrait artwork from uploaded photos in an editorial and artistic photography style. The background has a soft gradient effect, transitioning from medium gray to almost pure white, creating a sense of depth and silence. The fine film grain texture adds a tactile, analog photography-like softness to the picture, reminiscent of classic black and white photography. His face, contoured by light, evokes a sense of mystery, intimacy and elegance. His features are delicate and profound, exuding a melancholic and poetic beauty without being pretentious. A gentle directional light, softly diffused, gently caresses the curve of his cheek, or flashes a light in his eyes - this is the emotional core of the picture. The rest is occupied by a lot of negative space, deliberately kept simple, allowing the picture to breathe freely. There are no words or logos in the picture - only light and shadow intertwined with emotions. Generate a 2*2 photo of different poses`;
    },
    parameters: [],
  },
  {
    id: "fashion-portrait",
    defaultModel: "doubao-seedream-4-0-250828",
    shouldUseOptimizePrompt: true,
    examples: {
      general: [
        "https://file.302.ai/gpt/imgs/20250919/8a484de94f618ba3425c69ea5a63ef3a.jpg",
        "https://file.302.ai/gpt/imgs/20250923/6509039af1872e4adfb4b25f6f110f7d.jpg",
      ],
    },
    systemPrompt: `
    Optimize and enhance the prompts provided for image generation to ensure that Seedream or other diffusion models can generate excellent views. This prompt is used to generate portrait commercial photos.

Input example:
Gender: Female
Hairstyle: Low cut hair
Clothing: Black camisole dress with rhinestones
Other Requirements: None

Output example:
Please take a commercial photo of the lady in the picture, with consistent facial features. The character description features delicate facial features and a gentle yet confident gaze. Her hairstyle is a casual and lazy low rise hairstyle, with a few strands of hair in front of her forehead, creating a casual and relaxed feeling. In terms of makeup, emphasis is placed on a natural nude look, with a focus on clear base makeup, well-defined eyelashes, and orange pink lipstick. The overall makeup is clean and glossy.

Clothing and Accessories: The character is wearing a black camisole dress, with the camisole section made up of shiny rhinestones or silver chains, adding a sense of sophistication and design. She wore rhinestone tassel earrings that matched the camisole, as well as simple silver bracelets and rings, which were embellished perfectly, neither overly ostentatious nor enhancing the overall delicacy.
Posture and Movement: This is a half body portrait. The character sits sideways, with a slightly forward leaning upper body, and their body language appears relaxed and elegant. She lightly supported her profile with her hand and stared directly at the camera, showing a confident yet slightly thoughtful posture. The other arm was casually placed on the table, forming natural lines.
Scene and Background: The background is very simple, with a pure gray background and no unnecessary clutter, focusing all the attention on the characters. The table is made of black smooth marble or glass material, reflecting a faint luster and adding a sense of layering to the picture. This background selection is very suitable for highlighting the main character and creating a sophisticated and professional atmosphere.
Light and shadow effects: Soft studio lighting is used. The light source is slightly tilted from the front of the character, casting uniform and soft light on her face and arms, with almost no hard shadows, making the skin look delicate and smooth. The entire picture is bright and transparent, creating a cool and clean atmosphere.
Camera Style: The camera style of this photo is commercial portrait photography. The focal length of the lens should be medium to long (such as 85mm or 100mm), which can effectively blur the background without producing significant distortion. The depth of field is shallow, the main character is clear, and the background is soft and blurred. The color style tends towards low saturation, warm gray tones, delicate texture, and a sense of luxury.

User input format:
Gender: {{Gender of Commercial Photography Model}}
Hairstyle: {{User specified model hairstyle}}
Clothing: {{User specified model clothing}}
Other Requirements: {{User's other requirements for the photoshoot; leave "None" if no requirements apply}}

Directly output optimization results without any explanation.
    `,
    prompt: (params: {
      gender: string;
      hairstyle: string;
      clothing: string;
      other_requirements: string;
    }) => {
      return `
      Gender: ${params.gender}
Hairstyle: ${params.hairstyle}
Clothing: ${params.clothing}
Other Requirements: ${params.other_requirements}
      `;
    },
    parameters: [
      {
        key: "gender",
        label: "Gender",
        type: "select",
        options: ["male", "female"],
        placeholder: "Select gender",
        defaultValue: "male",
      },
      {
        key: "hairstyle",
        label: "Hairstyle",
        type: "textarea",
        placeholder: "User specified model hairstyle",
        defaultValue: "",
      },
      {
        key: "clothing",
        label: "Clothing",
        type: "textarea",
        placeholder: "User specified model clothing",
        defaultValue: "",
      },
      {
        key: "other_requirements",
        label: "Other Requirements",
        type: "textarea",
        placeholder:
          "User's other requirements for the photoshoot; leave 'None' if no requirements apply",
        defaultValue: "",
      },
    ],
  },
  {
    id: "museum-lost",
    defaultModel: "doubao-seedream-4-0-250828",
    examples: {
      general: [
        "https://file.302.ai/gpt/imgs/20250923/768178f453c238f826e8554bf239b77c.jpg",
        "https://file.302.ai/gpt/imgs/20250923/bf5c854d104a58c2afe252a63fd82242.jpg",
      ],
    },
    prompt: (params: { gender: string }, model: string) => {
      const prompts = {
        male: "A high-contrast black-and-white photograph from a modern art gallery. Taken candidly, the photo shows a young man standing quietly amidst a blurred crowd. The angle is slightly tilted, with his face slightly turned (not completely facing the camera). A three-quarter shot (from mid-thigh up). He wears a dark overcoat, his hands in his pockets. Behind him: Banksy's framed works arranged in a grid.",
        female:
          "High-contrast black & white photo in a modern art gallery. Candid 'stolen shot' of a young woman standing still among a blurred moving crowd. Slightly slanted angle, face partly turned (not fully side view/camera). 3/4 body shot (mid-thigh up). Wearing a long dark coat, hands in pockets. Behind her: framed Banksy artworks arranged in a grid",
      };
      return prompts[params.gender as keyof typeof prompts] || prompts.male;
    },
    parameters: [
      {
        key: "gender",
        label: "Gender",
        type: "select",
        options: ["male", "female"],
        placeholder: "Select gender",
        defaultValue: "male",
      },
    ],
  },
  {
    id: "light-painting-portrait",
    defaultModel: "doubao-seedream-4-0-250828",
    examples: {
      general: [
        "https://file.302.ai/gpt/imgs/20250923/a13eedd277fe548f004af0030c308b9c.jpg",
        "https://file.302.ai/gpt/imgs/20250923/5c253840c80ef433327f022a9336aab3.jpg",
      ],
    },
    prompt: () => {
      return "Transform the person in the attached image into a high-resolution color portrait artwork. Clothing and hairstyles can be altered, but the face remains faithful to its originality. The subtle film grain lends the image a tactile, soft, analog quality reminiscent of classic black-and-white photography. The subject is not posed in a traditional way, but appears captured in a moment of reflection or breath. His face, framed by the light, evokes a sense of mystery and elegance. His features are refined and profound, radiating a melancholic and poetic beauty. A gentle, directional light, softly diffused across the curve of his cheek or a glint in his eye, creates the emotional core of the image. The rest of the image is kept simple, with ample negative space. No text or logos are featured—only a play of light and shadow, and emotion. The overall atmosphere, reminiscent of a fleeting glance, possesses a wistful beauty. A solid-color interior background.";
    },
    parameters: [],
  },
  {
    id: "comic-portrait",
    defaultModel: "doubao-seedream-4-0-250828",
    examples: {
      general: [
        "https://file.302.ai/gpt/imgs/20250923/b4cce5b3c3e00604fe83215f269d9b16.jpg",
        "https://file.302.ai/gpt/imgs/20250923/6967da159c78c4ea9ad29bec933d161f.jpg",
      ],
    },
    prompt: () => {
      return "The central figure, extracted from the uploaded image, is rendered in full, vibrant photorealistic color and sharp detail. They are dramatically lit to powerfully stand out. The background is an intricately detailed, multi-panel, black and white comic strip, entirely wordless and filled with humorous, exaggerated narratives directly featuring the central figure. These comic panels should not only depict the subject in funny, light-hearted, or slightly absurd scenarios, but also seamlessly integrate the central figure into the surrounding comic world. The colorful main subject should appear as if they are an integral part of this dynamic, monochromatic comic reality, perhaps 'stepping out' or 'frozen within' a specific comic panel, with their pose and expression directly interacting with the surrounding black and white narrative. The comic panels are drawn in a classic, high-contrast comic book style with bold lines, and creatively arranged to create a cohesive and engaging narrative backdrop strongly linking the vibrant figure to the detailed monochrome comic environment.";
    },
    parameters: [],
  },
  {
    id: "hair-style",
    defaultModel: "gemini-2.5-flash-image-preview",
    examples: {
      general: [
        "https://file.302.ai/gpt/imgs/20250923/a78465f3c8beb34258dbea4fabd85105.jpg",
        "https://file.302.ai/gpt/imgs/20250923/2da990e256050f66714db55a805716f4.jpg",
      ],
    },
    prompt: () => {
      return "Design 9 different but suitable hairstyles for the characters in the attached image and display them on one photo, ensuring high consistency of facial height";
    },
    parameters: [],
  },
];
