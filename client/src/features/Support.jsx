import { useNavigate } from "react-router";
import { ArrowLeft, MessageCircle, Mail, HelpCircle, ChevronRight, Phone, ExternalLink } from "lucide-react";
import * as Accordion from "@radix-ui/react-accordion";

export function Support() {
  const navigate = useNavigate();

  const faqs = [
    {
      question: "How do I update fuel prices?",
      answer: "Find a station on the map, tap on it to view details, and click the 'Update Price' button. Enter the current prices for the fuel types available and submit. Your update will be verified by other users."
    },
    {
      question: "What are points and how do I earn them?",
      answer: "You earn points for every verified price update you contribute. Points help increase your 'Contributor Level' and unlock badges like 'Trusted Contributor'."
    },
    {
      question: "Is the data accurate?",
      answer: "Our data is crowdsourced and verified by the community. We use algorithms to detect outliers and reward users with high accuracy rates. Always check the 'Updated' timestamp on station details."
    },
    {
      question: "How do I report a missing station?",
      answer: "You can add a new station by clicking the '+' button on the Home page or using the 'Add Station' option in the menu. Provide the name, brand, and location to help others."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-neutral-900 dark:to-neutral-950 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-emerald-600 via-green-600 to-teal-700 pt-12 pb-8 px-4 lg:px-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-400/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

        <div className="relative z-10 flex items-center gap-3 max-w-7xl mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="w-12 h-12 bg-white dark:bg-neutral-800 backdrop-blur-xl rounded-full flex items-center justify-center shadow-2xl shadow-black/20 hover:scale-110 transition-transform border-2 border-white/40 dark:border-neutral-700/50"
          >
            <ArrowLeft className="w-6 h-6 text-emerald-600 dark:text-emerald-400" strokeWidth={2.5} />
          </button>
          <h1 className="text-3xl lg:text-4xl font-bold text-white drop-shadow-2xl tracking-tight">Help & Support</h1>
        </div>
      </div>

      <div className="px-4 lg:px-8 py-6 lg:py-10">
        <div className="max-w-3xl mx-auto space-y-10">
          {/* Quick Contact */}
          <div className="grid grid-cols-2 gap-4 lg:gap-6">
            <button className="bg-white dark:bg-neutral-800/50 backdrop-blur-xl p-6 rounded-3xl border-2 border-gray-100 dark:border-neutral-700/40 shadow-xl hover:border-emerald-400/50 transition-all text-center group">
              <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <MessageCircle className="w-7 h-7 text-emerald-600 dark:text-emerald-400" strokeWidth={2.5} />
              </div>
              <div className="font-bold text-foreground">Live Chat</div>
              <div className="text-xs text-muted-foreground mt-1 font-semibold">Available 9am-6pm</div>
            </button>
            <button className="bg-white dark:bg-neutral-800/50 backdrop-blur-xl p-6 rounded-3xl border-2 border-gray-100 dark:border-neutral-700/40 shadow-xl hover:border-emerald-400/50 transition-all text-center group">
              <div className="w-14 h-14 bg-teal-100 dark:bg-teal-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Mail className="w-7 h-7 text-teal-600 dark:text-teal-400" strokeWidth={2.5} />
              </div>
              <div className="font-bold text-foreground">Email Us</div>
              <div className="text-xs text-muted-foreground mt-1 font-semibold">Response in 24h</div>
            </button>
          </div>

          {/* FAQs */}
          <div>
            <div className="flex items-center gap-3 mb-6 px-1">
              <div className="w-10 h-10 bg-amber-100 dark:bg-amber-500/10 rounded-xl flex items-center justify-center shadow-md">
                <HelpCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" strokeWidth={2.5} />
              </div>
              <h2 className="text-xl lg:text-2xl font-bold text-foreground tracking-tight">Frequently Asked Questions</h2>
            </div>
            
            <Accordion.Root type="single" collapsible className="space-y-4">
              {faqs.map((faq, index) => (
                <Accordion.Item
                  key={index}
                  value={`faq-${index}`}
                  className="bg-white dark:bg-neutral-800/50 backdrop-blur-xl rounded-2xl border-2 border-gray-100 dark:border-neutral-700/40 shadow-lg overflow-hidden group"
                >
                  <Accordion.Header>
                    <Accordion.Trigger className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 dark:hover:bg-neutral-800 transition-all group-data-[state=open]:bg-emerald-50/50 dark:group-data-[state=open]:bg-emerald-950/20">
                      <span className="font-bold text-foreground text-base lg:text-lg tracking-tight pr-4">{faq.question}</span>
                      <ChevronRight className="w-5 h-5 text-muted-foreground transition-transform duration-300 group-data-[state=open]:rotate-90" strokeWidth={2.5} />
                    </Accordion.Trigger>
                  </Accordion.Header>
                  <Accordion.Content className="p-5 text-muted-foreground/90 font-medium text-sm lg:text-base leading-relaxed border-t border-gray-100 dark:border-neutral-700/30">
                    {faq.answer}
                  </Accordion.Content>
                </Accordion.Item>
              ))}
            </Accordion.Root>
          </div>

          {/* Social / Links */}
          <div className="pt-6">
            <div className="bg-gradient-to-br from-neutral-800 to-neutral-900 dark:from-neutral-800 dark:to-neutral-950 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:scale-125 transition-transform duration-1000" />
              
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <h3 className="text-xl font-bold mb-2">Join the Community</h3>
                  <p className="text-neutral-300 text-sm font-medium">Follow us for real-time fuel price alerts and community updates.</p>
                </div>
                <div className="flex gap-3">
                   <button className="p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-colors backdrop-blur-md border border-white/10">
                    <ExternalLink className="w-5 h-5" />
                  </button>
                  <button className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-emerald-500/20">
                    Follow Us
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
