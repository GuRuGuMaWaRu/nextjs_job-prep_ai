import { HeadphonesIcon, MessageCircle, Zap } from "lucide-react";

export function WhyUpgradeSection() {
  const points = [
    {
      icon: <Zap className="w-5 h-5 text-primary" />,
      text: "Unlimited AI mock interviews so you can practice until you're confident.",
    },
    {
      icon: <MessageCircle className="w-5 h-5 text-primary" />,
      text: "Unlimited practice questions tailored to your target role.",
    },
    {
      icon: <HeadphonesIcon className="w-5 h-5 text-primary" />,
      text: "Priority support when you need help before a big interview.",
    },
  ];

  return (
    <section className="max-w-2xl mx-auto">
      <h2 className="text-xl font-semibold tracking-tight mb-4 text-center">
        Why upgrade?
      </h2>
      <ul className="space-y-4">
        {points.map((point, i) => (
          <li key={i} className="flex gap-3 items-start">
            <span className="shrink-0 mt-0.5 rounded-lg bg-primary/10 p-1.5">
              {point.icon}
            </span>
            <span className="text-muted-foreground">{point.text}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
