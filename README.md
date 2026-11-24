# The Sunset

A small, private planning tool for maintainers who are thinking about decommissioning an open-source project. It asks around ten questions and turns the answers into a plan: hand the project over, or decommission it with care (tell people, help them move, look after user data, archive what matters).

The questions and steps follow the end-of-life model from *End-of-life Planning in Open-Source Software Projects* (Correia, Serebrenik, Wilson, Baltes), which was built from interviews with people who had decommissioned software projects and then checked with them.

Everything runs in the browser. Answers are saved to `localStorage` on the visitor's device and are never sent anywhere. The page loads no external fonts or scripts.


- `src/plan.js`: questions, routing, plan generation, notice draft and Markdown export
- `src/App.jsx`: the interface (welcome, questions, plan)
- `src/index.css`: styles, including dark mode and print


___
**A Note about Generative AI**: This website was built with Generative AI tools (Opus 5.5), based on the research and interviews conducted before. 
During the research period, Generative AI tools were NOT used.