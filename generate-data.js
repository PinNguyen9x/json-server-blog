const faker = require("faker");
const fs = require("fs");

faker.locale = "vi";

(() => {
  const randomPostList = () => {
    return [
      {
        id: faker.random.uuid(),
        title: "Practical Micro Frontends: Building Scalable UIs",
        author: "Pin Nguyen",
        createdAt: Date.now(),
        updatedAt: Date.now(),
        slug: "",
        publishedDate: "2024-06-15T03:00:00Z",
        tagList: ["Design", "Pattern"],
        description: `This post explores how to implement micro frontends by breaking down monolithic UIs into smaller, manageable pieces. Using tools like React, Webpack, and Module Federation, you'll learn how to create scalable, maintainable front-end applications that enhance team collaboration and project flexibility.`,
      },
      {
        id: faker.random.uuid(),
        title: "Large Language Model (LLM) & Chatbox",
        author: "Pin Nguyen",
        createdAt: Date.now(),
        updatedAt: Date.now(),
        slug: "",
        publishedDate: "2024-06-16T03:00:00Z",
        tagList: ["AI", "Mechine Learning"],
        description:
          "This is a model that provides a general introduction to AI chatbots, large language models (LLMs), how to apply them in the workplace, essential knowledge about AI and prompts, their advantages and disadvantages, key terms related to LLMs, and tools that help enhance productivity for developers.",
      },
    ];
  };
  const randomWorkList = () => {
    return [
      {
        id: faker.random.uuid(),
        title: "Game tic tac toe",
        thumbnailUrl:
          "https://plus.unsplash.com/premium_photo-1673735396428-d51dc2a7a62d?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1yZWxhdGVkfDV8fHxlbnwwfHx8fHw%3D",
        tagList: ["Game", "Web", "TypeScript"],
        fullDescription: "",
        createdAt: "1722091716231",
        updatedAt: "1722091716231",
        shortDescription:
          "A TypeScript Tic-Tac-Toe game where players take turns marking X and O on a 3x3 grid, with the winner determined by three aligned marks",
      },
      {
        id: faker.random.uuid(),
        title: "Game Color Matching",
        thumbnailUrl:
          "https://plus.unsplash.com/premium_photo-1681843681830-7d4b70a435c1?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NXx8Y29sb3J8ZW58MHx8MHx8fDA%3D",
        tagList: ["Game", "Web", "TypeScript"],
        fullDescription: "",
        createdAt: "1722091716231",
        updatedAt: "1722091716231",
        shortDescription:
          "A TypeScript-based Color Matching game where players swap tiles to align three or more of the same color, with increasing difficulty and challenges as they progress.",
      },
      {
        id: faker.random.uuid(),
        title: "Dashboard",
        thumbnailUrl:
          "https://media.istockphoto.com/id/1292897536/vi/vec-to/b%E1%BA%A3ng-%C4%91i%E1%BB%81u-khi%E1%BB%83n-%C4%91%E1%BB%93-h%E1%BB%8Da-th%C3%B4ng-tin-giao-di%E1%BB%87n-ng%C6%B0%E1%BB%9Di-d%C3%B9ng-%C4%91%E1%BB%93-h%E1%BB%8Da-d%E1%BB%AF-li%E1%BB%87u-v%C3%A0-bi%E1%BB%83u-%C4%91%E1%BB%93-s%C3%A0ng-l%E1%BB%8Dc.jpg?s=612x612&w=0&k=20&c=w1zIeckEvKHq8IohmsCOOQdAkoM4-aQHP0SX0uu1SeE=",
        tagList: ["Web", "TypeScript", "ReactJS", "NextJS", "MongoDB"],
        fullDescription: "",
        createdAt: "1722091716231",
        updatedAt: "1722091716231",
        shortDescription:
          "A TypeScript-based CRUD application for managing data entries, allowing users to create, read, update, and delete records with an intuitive interface, real-time updates, and error handling.",
      },
    ];
  };
  const workList = randomWorkList();
  const postList = randomPostList();

  const db = {
    posts: postList,
    works: workList,
    profile: { name: "typicode" },
  };
  // write data to db.json
  fs.writeFile("db.json", JSON.stringify(db), () => {
    console.log("Generate data successfully");
  });
})();
