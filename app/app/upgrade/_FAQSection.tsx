import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/core/components/ui/accordion";
import { formatFreePlanLimitsSummary } from "@/core/features/billing/plans";

const FAQ_ITEMS = [
  {
    question: "What's included in Pro?",
    answer: `Pro removes the Free plan limits of ${formatFreePlanLimitsSummary()}. You get unlimited voice interviews, resume analyses, and practice questions with the same AI feedback workflows.`,
  },
  {
    question: "Can I cancel anytime?",
    answer:
      "Yes. You can cancel your Pro subscription at any time. You'll keep access until the end of your billing period, then your account will switch back to the Free plan.",
  },
  {
    question: "How does billing work?",
    answer:
      'Pro is billed monthly at the start of each billing cycle. Manage your subscription or payment method from this page using the "Manage subscription" button.',
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
