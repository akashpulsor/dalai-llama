export function createMockSttStream(callback) {
  const phrases = [
    "Hello thanks for calling",
    "I want to check my order",
    "Sure give me a moment",
    "Your order status is confirmed"
  ];

  let index = 0;

  return setInterval(() => {
    callback({
      speaker: index % 2 === 0 ? "customer" : "agent",
      text: phrases[index % phrases.length],
      sentiment: Math.random() > 0.5 ? "positive" : "neutral",
    });
    index++;
  }, 1800);
}
