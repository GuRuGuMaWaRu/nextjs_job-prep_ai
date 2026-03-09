import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/core/components/ui/accordion";

const FAQ_ITEMS = [
  {
    question: "What's included in Pro?",
    answer:
      "Pro includes unlimited AI mock interviews, unlimited practice questions, advanced resume optimization, priority support, interview performance analytics, and custom job description analysis.",
  },
  {
    question: "Can I cancel anytime?",
    answer:
      "Yes. You will be able to cancel your Pro subscription at any time. You'll keep access until the end of your billing period, then your account will switch back to the Free plan.",
  },
  {
    question: "How does billing work?",
    answer:
      'Pro will be billed monthly. Payment will be charged at the start of each billing cycle. We plan to send you a receipt by email. You will be able to manage your subscription or payment method from the Upgrade page using the "Manage subscription" button.',
  },
] as const;

export function FAQSection() {
  return (
    <section className="max-w-2xl mx-auto">
      <h2 className="text-xl font-semibold tracking-tight mb-4 text-center">
        Frequently asked questions
      </h2>
      <Accordion type="single" collapsible className="w-full">
        {FAQ_ITEMS.map((item) => (
          <AccordionItem key={item.question} value={item.question}>
            <AccordionTrigger>{item.question}</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              {item.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
