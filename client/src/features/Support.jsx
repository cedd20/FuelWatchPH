import { useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "framer-motion";
import { ArrowLeft, Mail, HelpCircle, ChevronDown } from "lucide-react";
import * as Accordion from "@radix-ui/react-accordion";
import { ContactModal } from "@/shared/components/ContactModal";

export function Support() {
  const navigate = useNavigate();
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

  const faqs = [
    {
      question: "How do I update fuel prices?",
      answer: "Find a station on the map, tap on it to view details, and click the 'Update Price' button. Enter the current prices for the fuel types available and submit. Your update will be verified by other users."
    },
    {
      question: "What is Community Karma and how do I earn it?",
      answer: "You earn Karma for every verified price update you contribute. Karma reflects your standing in the community and helps unlock badges like 'Trusted Contributor'."
    },
    {
      question: "Is the data accurate?",
      answer: "Our data is crowdsourced and verified by the community. We use algorithms to detect outliers and reward users with high trust scores. Always check the 'Updated' timestamp on station details."
    },
    {
      question: "How do I report a missing station?",
      answer: "You can add a new station by clicking the '+' button on the Home page or using the 'Add Station' option in the menu. Provide the name, brand, and location to help others."
    }
  ];

  return (
    <div className="app-shell min-h-screen pb-28 text-foreground">
      {/* Header */}
      <div className="relative pt-10 pb-24 px-6 overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3" />
        <div className="max-w-2xl mx-auto relative z-10">
          <div className="flex items-center gap-6 mb-10">
            <button
              onClick={() => navigate(-1)}
              className="app-panel group rounded-full p-3 transition-all hover:bg-emerald-500 hover:text-white shadow-2xl"
            >
              <ArrowLeft className="w-6 h-6 group-hover:scale-110 transition-transform" />
            </button>
            <div>
              <h1 className="text-4xl font-black tracking-tight">Help Center</h1>
              <p className="mt-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">We're here to help</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 -mt-12 space-y-6">

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="app-panel rounded-[3rem] p-8 shadow-2xl"
        >
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center">
              <HelpCircle className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg font-black">FAQs</h2>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Common questions answered</p>
            </div>
          </div>

          <Accordion.Root type="single" collapsible className="space-y-3">
            {faqs.map((faq, index) => (
              <Accordion.Item
                key={index}
                value={`faq-${index}`}
                className="app-elevated group overflow-hidden rounded-2xl border transition-all data-[state=open]:border-emerald-500/20"
              >
                <Accordion.Header>
                  <Accordion.Trigger className="w-full flex items-center justify-between p-5 text-left group">
                    <span className="pr-4 text-sm font-bold text-foreground transition-colors group-data-[state=open]:text-emerald-600 dark:group-data-[state=open]:text-emerald-300">{faq.question}</span>
                    <ChevronDown
                      className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-300 group-data-[state=open]:rotate-180 group-data-[state=open]:text-emerald-400"
                      strokeWidth={2.5}
                    />
                  </Accordion.Trigger>
                </Accordion.Header>
                <Accordion.Content className="px-5 pb-5 text-sm font-medium leading-relaxed text-muted-foreground">
                  {faq.answer}
                </Accordion.Content>
              </Accordion.Item>
            ))}
          </Accordion.Root>
        </motion.div>

        {/* Contact Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <button
            onClick={() => setIsContactModalOpen(true)}
            className="w-full bg-gradient-to-br from-emerald-600 to-teal-700 rounded-[3rem] p-10 shadow-2xl shadow-emerald-500/20 relative overflow-hidden group hover:scale-[1.01] active:scale-[0.99] transition-all"
          >
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="relative z-10 flex flex-col items-center gap-4 text-center">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-xl">
                <Mail className="w-8 h-8 text-white" strokeWidth={2.5} />
              </div>
              <div>
                <div className="mb-3">
                  <span className="inline-flex items-center rounded-full border border-white/30 bg-white/15 px-5 py-2 text-sm font-black uppercase tracking-[0.18em] text-white shadow-lg">
                    Send Us a Message
                  </span>
                </div>
                <div className="text-emerald-200 text-xs font-bold uppercase tracking-widest">We reply within 24 hours</div>
              </div>
            </div>
          </button>
        </motion.div>

        {/* Community Banner */}
        {/* <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="app-panel relative overflow-hidden rounded-[3rem] p-8 shadow-2xl"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-teal-500/10 rounded-2xl flex items-center justify-center shrink-0">
                <MessageCircle className="w-6 h-6 text-teal-400" />
              </div>
              <div>
                <div className="font-black text-lg mb-1">Join the Community</div>
                <p className="text-xs font-bold leading-relaxed text-muted-foreground">Get real-time fuel alerts and updates from other contributors.</p>
              </div>
            </div>
            <button className="px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/20 shrink-0">
              Follow Us
            </button>
          </div>
        </motion.div> */}
      </div>

      <ContactModal isOpen={isContactModalOpen} onClose={() => setIsContactModalOpen(false)} />
    </div>
  );
}
