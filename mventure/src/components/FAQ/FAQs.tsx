
interface FAQItem {
  question: string;
  answer: string[];
}
const faqData: FAQItem[] = [
  {
    question: "What is MVenture?",
    answer: ["MVenture is a professionally managed investment platform that focuses on low-risk, ethical, and long-term growth strategies."]
  },
  {
    question: "What do we do here?",
    answer: ["We handle everything from market analysis and asset selection to portfolio management, reporting, and ongoing performance monitoring."]
  },
  {
    question: "Who can join MVenture?",
    answer: ["Anyone 18+ — from first-time investors to seasoned pros, locally or abroad."]
  },
  {
    question: "Why choose MVenture?",
    answer: ["✔ Expert management ✔ Stable, ethical investments ✔ Passive & time‑saving approach"]
  },
  {
    question: "How does the investment process work?",
    answer: ["We analyze → invest → manage → report — so you can stay hands‑off while staying informed."]
  },
  {
    question: "What are the benefits of investing through MVenture?",
    answer: [
      "✨ Diversified portfolio to manage risk effectively.",
      "✨ Access to opportunities not easily available to individual investors.",
      "✨ Continuous professional oversight.",
      "✨ Transparent and regular reporting on your investments"
    ]
  },
  {
    question: "Is there a minimum investment amount?",
    answer: ["Yes, MVenture has a low minimum investment requirement, making it accessible for a wide range of investors which is 500 USDT."]
  }
]

export const FAQEntry: React.FC<FAQItem> = ({ question, answer }) => {
  return (
    <div className="bg-gray-200 border rounded-xl p-3 gap-2">
      <h3 className="font-semibold">{question}</h3>
      <ul>
        {answer.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    </div>
  )
}

const FAQs = () => {
  return (
    <div className="flex flex-col gap-3 p-2">
      <h2 className="font-semibold text-3xl font-['Prosto_One']">Frequently Ask Questions</h2>
      {faqData.map((faq, index) => (
        <FAQEntry key={index} {...faq} />
      ))}
    </div>
  )
}

export default FAQs

