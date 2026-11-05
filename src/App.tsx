import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type FormEvent, type ReactNode } from 'react';
import {
  Search, MapPin, Calendar, ChevronDown, Heart, Wallet, Coffee, Check,
  Menu, X, ArrowUpRight, Home, Users, Shield, FileText,
  CheckCircle2, ArrowRight, GraduationCap, Scale, MessageCircle, KeyRound,
  Instagram, Plus, Map as MapIcon, UserRound,
} from 'lucide-react';
import Logo from './components/Logo';
import SmartImage from './components/SmartImage';
import PropertyModal from './components/PropertyModal';
import AccountDialog from './components/account/AccountDialog';
import ListingDialog from './components/listing/ListingDialog';
import LegalDialog from './components/legal/LegalDialog';
import { CAMPUSES, PROPERTIES, campusById } from './data/properties';
import { AuthProvider, useAuth } from './lib/auth';
import { DialogsProvider, useDialogs } from './lib/dialogs';
import { getPublishedListings } from './lib/db';
import type { CityName, Property } from './types';


interface City {
  id: string;
  name: CityName;
  abbr: string;
  subtitle: string;
  desc: string;
  tags: string[];
  transport: string;
  image: string;
}

interface FaqItem {
  q: string;
  a: string;
}

interface Filters {
  campusId: string;
  maxBudget: number | null;
  maxDistance: number | null;
  moveDate: string;
}


const FEATURED_CAMPUSES = ['usp-butanta', 'unicamp-barao', 'unesp-bauru', 'ufabc-sa'];

const CITIES: City[] = [
  {
    id: 'sp',
    name: 'São Paulo',
    abbr: 'SP',
    subtitle: 'USP, Mackenzie, PUC-SP, UNIFESP e mais',
    desc: 'Butantã e Rio Pequeno para a Cidade Universitária; Higienópolis, Consolação e Perdizes para o centro expandido. Compare o trajeto e o custo total, não só o aluguel.',
    tags: ['Butantã', 'Perdizes', 'Higienópolis', 'Vila Mariana'],
    transport: 'Metrô, CPTM e ônibus conectam os principais campi. Confira a estação mais próxima do seu prédio de aula.',
    image: 'https://images.unsplash.com/photo-1543059080-f9b1272213d5?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'campinas',
    name: 'Campinas',
    abbr: 'CPS',
    subtitle: 'UNICAMP, PUC-Campinas',
    desc: 'Barão Geraldo concentra a vida universitária. O caminho real ajuda a decidir entre ir a pé, de bike ou de ônibus.',
    tags: ['Barão Geraldo', 'Cidade Universitária', 'Cambuí'],
    transport: 'Ônibus municipais e linhas internas atendem o campus. Consulte os horários noturnos.',
    image: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'bauru',
    name: 'Bauru',
    abbr: 'BRU',
    subtitle: 'UNESP, USP (Odontologia), FATEC',
    desc: 'Vargem Limpa e arredores do campus reúnem repúblicas e quartos com preços mais acessíveis que na capital.',
    tags: ['Vargem Limpa', 'Jardim Infante Dom Henrique', 'Centro'],
    transport: 'Linhas de ônibus ligam o centro ao campus. Muita gente vai de bike ou a pé.',
    image: 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'saocarlos',
    name: 'São Carlos',
    abbr: 'SCA',
    subtitle: 'UFSCar, USP São Carlos',
    desc: 'Cidade com alma universitária. Jardim Bandeirantes e Cidade Jardim ficam no caminho da UFSCar; o centro atende bem a USP.',
    tags: ['Jardim Bandeirantes', 'Cidade Jardim', 'Centro'],
    transport: 'Ônibus circulares atendem os campi. Avalie subidas e o trajeto à noite.',
    image: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=800&q=80',
  },
];

const FAQ: FaqItem[] = [
  {
    q: 'A UNIdus faz parte de alguma universidade?',
    a: 'Não. Somos uma plataforma independente voltada a estudantes atuais e ingressantes das faculdades paulistas. Não somos um site oficial nem representamos USP, UNICAMP, UNESP, UFSCar, UFABC ou qualquer outra instituição.',
  },
  {
    q: 'Ainda não saiu a lista de aprovados. Já posso procurar moradia?',
    a: 'Pode, e é uma boa ideia. Entre a lista da Fuvest, Comvest, Vunesp ou do SiSU e a matrícula costuma haver pouco tempo. Salve seus favoritos, compare bairros e converse com repúblicas antes, assim você só fecha quando tiver a vaga confirmada.',
  },
  {
    q: 'O valor do anúncio inclui as contas?',
    a: 'Depende do anúncio. Mostramos o aluguel e, ao lado, a estimativa de contas (luz, água, internet, gás e condomínio). Quando aparece “contas inclusas”, confirme com o anunciante o que de fato está incluído.',
  },
  {
    q: 'Preciso de fiador para alugar?',
    a: 'Muitos quartos e repúblicas não pedem fiador e trabalham com caução (geralmente 1 a 3 meses) ou seguro-fiança. Em apartamentos por imobiliária, o fiador ou seguro é mais comum. Cada anúncio informa as garantias aceitas.',
  },
  {
    q: 'E a moradia estudantil oficial das universidades?',
    a: 'Universidades como USP (CRUSP), UNICAMP, UNESP e UFSCar têm programas próprios de moradia e permanência estudantil, com editais e critérios socioeconômicos. Vale se inscrever neles também; a UNIdus é uma alternativa complementar no mercado privado.',
  },
  {
    q: 'Como saber se uma república combina comigo?',
    a: 'Pergunte sobre rotina, visitas, divisão de tarefas, festas, silêncio em semana de provas e como as contas são divididas. Se possível, visite e converse com os moradores antes de decidir.',
  },
  {
    q: 'O que conferir antes de fechar o aluguel?',
    a: 'Visite o imóvel (ou peça uma chamada de vídeo), confira o contrato, quem é o proprietário, o valor total do mês, o trajeto até o campus à noite e nunca pague sinal sem ter visto o lugar e o documento.',
  },
];

const BUDGET_OPTIONS = [
  { value: 800, label: 'Até R$ 800' },
  { value: 1200, label: 'Até R$ 1.200' },
  { value: 1500, label: 'Até R$ 1.500' },
  { value: 2000, label: 'Até R$ 2.000' },
];

const DISTANCE_OPTIONS = [
  { value: 1, label: 'Até 1 km' },
  { value: 2, label: 'Até 2 km' },
  { value: 3, label: 'Até 3 km' },
  { value: 5, label: 'Até 5 km' },
];

const QUICK_FILTERS = ['Todos os campi', 'São Paulo', 'Campinas', 'Bauru', 'São Carlos', 'Santo André', 'Até R$ 1.000'] as const;
type QuickFilter = (typeof QUICK_FILTERS)[number];

const DEFAULT_FILTERS: Filters = { campusId: 'all', maxBudget: null, maxDistance: null, moveDate: '' };

const brl = (v: number) => `R$ ${v.toLocaleString('pt-BR')}`;
const km = (v: number) => `${v.toLocaleString('pt-BR', { minimumFractionDigits: 1 })} km`;


const Container = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <div className={`px-4 sm:px-6 md:px-12 max-w-[1400px] mx-auto ${className}`}>{children}</div>
);

const Eyebrow = ({ children, tone = 'navy' }: { children: ReactNode; tone?: 'navy' | 'amber' | 'emerald' }) => {
  const color = {
    navy: 'text-[#112340] bg-[#112340]',
    amber: 'text-amber-500 bg-amber-500',
    emerald: 'text-emerald-800 bg-emerald-800',
  }[tone];
  const [text, dot] = color.split(' ');
  return (
    <div className={`flex items-center gap-2 text-xs font-bold tracking-widest uppercase ${text} mb-4`}>
      <span className={`w-2 h-2 rounded-full ${dot}`} />
      {children}
    </div>
  );
};

const Reveal = ({
  children,
  delay = 0,
  className = '',
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!('IntersectionObserver' in window)) {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`reveal ${visible ? 'is-visible' : ''} ${className}`}
    >
      {children}
    </div>
  );
};

const delay = (ms: number): CSSProperties => ({ animationDelay: `${ms}ms` });

interface SelectFieldProps {
  label: string;
  icon: ReactNode;
  value: string;
  onChange: (v: string) => void;
  children: ReactNode;
}

const SelectField = ({ label, icon, value, onChange, children }: SelectFieldProps) => (
  <label className="flex flex-col w-full">
    <span className="text-xs text-slate-500 mb-1">{label}</span>
    <div className="relative flex items-center">
      <span className="absolute left-0 pointer-events-none">{icon}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none bg-transparent pl-6 pr-6 py-1 font-medium text-[#112340] focus:outline-none cursor-pointer truncate"
      >
        {children}
      </select>
      <ChevronDown className="w-4 h-4 text-slate-400 absolute right-0 pointer-events-none" />
    </div>
  </label>
);


const NAV_LINKS = [
  { href: '#moradias', label: 'Encontrar moradia' },
  { href: '#republicas', label: 'Repúblicas' },
  { href: '#como-funciona', label: 'Como funciona' },
  { href: '#cidades', label: 'Cidades' },
  { href: '#faq', label: 'Dúvidas' },
];

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, profile } = useAuth();
  const { openDialog } = useDialogs();
  const accountLabel = user ? (
    <>
      <UserRound className="w-4 h-4" /> {profile?.full_name.split(' ')[0] ?? 'Minha conta'}
    </>
  ) : (
    'Entrar'
  );

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 backdrop-blur-md border-b transition-all duration-300 ${
        scrolled || open
          ? 'bg-white/90 border-slate-200/80 shadow-[0_4px_24px_rgba(17,35,64,0.06)]'
          : 'bg-[#f7f7f5]/80 border-transparent'
      }`}
    >
      <nav
        className={`flex items-center justify-between px-4 sm:px-6 md:px-12 max-w-[1400px] mx-auto transition-all duration-300 ${
          scrolled ? 'py-2.5' : 'py-3 md:py-4'
        }`}
      >
        <a href="#topo" className="group flex items-center" aria-label="UNIdus, página inicial">
          <Logo
            className={`w-auto transition-all duration-300 ${scrolled ? 'h-10 md:h-11' : 'h-11 md:h-14'}`}
          />
        </a>

        <div className="hidden lg:flex items-center gap-8 text-sm font-medium text-slate-600">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="relative py-1 hover:text-[#112340] transition-colors after:absolute after:left-0 after:-bottom-0.5 after:h-0.5 after:w-full after:rounded-full after:bg-amber-400 after:origin-left after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:duration-300"
            >
              {l.label}
            </a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <button
            type="button"
            onClick={() => openDialog(user ? 'account' : 'login')}
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#112340] hover:bg-slate-100 px-4 py-2 rounded-lg transition"
          >
            {accountLabel}
          </button>
          <button
            type="button"
            onClick={() => openDialog('listing')}
            className="text-sm font-semibold text-[#112340] border border-slate-200 hover:border-[#112340]/30 bg-white px-5 py-2.5 rounded-xl shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all"
          >
            Anunciar moradia
          </button>
        </div>

        <button
          className="lg:hidden text-[#112340] p-2 -mr-2 rounded-lg hover:bg-slate-100 md:ml-3"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? 'Fechar menu' : 'Abrir menu'}
          aria-expanded={open}
        >
          <span className="relative block w-6 h-6">
            <Menu
              className={`absolute inset-0 w-6 h-6 transition-all duration-300 ${
                open ? 'opacity-0 rotate-90 scale-75' : 'opacity-100 rotate-0 scale-100'
              }`}
            />
            <X
              className={`absolute inset-0 w-6 h-6 transition-all duration-300 ${
                open ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-75'
              }`}
            />
          </span>
        </button>
      </nav>

      <div
        className={`lg:hidden grid transition-all duration-300 ease-out-expo ${
          open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden">
          <div className="px-4 sm:px-6 py-4 flex flex-col gap-1 border-t border-slate-200">
            {NAV_LINKS.map((l, i) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                tabIndex={open ? 0 : -1}
                style={{ transitionDelay: open ? `${60 + i * 40}ms` : '0ms' }}
                className={`py-3 px-2 rounded-lg font-medium text-[#112340] hover:bg-slate-50 transition-all duration-300 ${
                  open ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-3'
                }`}
              >
                {l.label}
              </a>
            ))}
            <div className="flex flex-col sm:flex-row gap-3 pt-3 mt-2 border-t border-slate-100 md:hidden">
              <button
                type="button"
                tabIndex={open ? 0 : -1}
                onClick={() => {
                  setOpen(false);
                  openDialog(user ? 'account' : 'login');
                }}
                className="flex-1 inline-flex items-center justify-center gap-2 text-sm font-semibold text-[#112340] border border-slate-200 px-4 py-3 rounded-xl"
              >
                {accountLabel}
              </button>
              <button
                type="button"
                tabIndex={open ? 0 : -1}
                onClick={() => {
                  setOpen(false);
                  openDialog('listing');
                }}
                className="flex-1 text-sm font-semibold text-white bg-[#112340] px-4 py-3 rounded-xl"
              >
                Anunciar moradia
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};


const SearchWidget = ({ onSearch }: { onSearch: (f: Filters) => void }) => {
  const [draft, setDraft] = useState<Filters>({ ...DEFAULT_FILTERS, campusId: 'usp-butanta', maxBudget: 1500, maxDistance: 3 });
  const set = <K extends keyof Filters>(key: K, value: Filters[K]) => setDraft((d) => ({ ...d, [key]: value }));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    onSearch(draft);
    document.getElementById('moradias')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <form
      onSubmit={submit}
      className="bg-white rounded-2xl md:rounded-[2rem] p-4 sm:p-5 md:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.05)] border border-slate-100 mt-10 md:mt-12 w-full max-w-6xl mx-auto"
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between border-b border-slate-100 pb-4 mb-4 gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 min-w-0">
          <span className="text-sm font-semibold text-[#112340] whitespace-nowrap">Onde você vai estudar?</span>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-1 px-1">
            {FEATURED_CAMPUSES.map((id) => {
              const active = draft.campusId === id;
              return (
                <button
                  type="button"
                  key={id}
                  onClick={() => set('campusId', id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-full whitespace-nowrap transition-all duration-300 active:scale-95 ${
                    active
                      ? 'bg-[#e8f0fe] text-[#112340] border border-transparent'
                      : 'border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                  }`}
                >
                  {active && <Check className="w-4 h-4 animate-pop" />}
                  {campusById(id)?.label}
                </button>
              );
            })}
          </div>
        </div>
        <span className="text-xs text-slate-400">Seu orçamento é o ponto de partida.</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1fr_auto] gap-4 lg:gap-0 items-end">
        <div className="lg:pr-4 lg:border-r border-slate-100">
          <SelectField
            label="Campus"
            icon={<GraduationCap className="w-4 h-4 text-amber-500" />}
            value={draft.campusId}
            onChange={(v) => set('campusId', v)}
          >
            <option value="all">Todos os campi</option>
            {CAMPUSES.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </SelectField>
        </div>

        <div className="lg:px-4 lg:border-r border-slate-100">
          <SelectField
            label="Orçamento mensal"
            icon={<Wallet className="w-4 h-4 text-amber-500" />}
            value={draft.maxBudget?.toString() ?? ''}
            onChange={(v) => set('maxBudget', v ? Number(v) : null)}
          >
            {BUDGET_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
            <option value="">Sem limite</option>
          </SelectField>
        </div>

        <div className="lg:px-4 lg:border-r border-slate-100">
          <label className="flex flex-col w-full">
            <span className="text-xs text-slate-500 mb-1">Quando quer se mudar?</span>
            <div className="relative flex items-center">
              <Calendar className="w-4 h-4 text-amber-500 absolute left-0 pointer-events-none" />
              <input
                type="month"
                value={draft.moveDate}
                onChange={(e) => set('moveDate', e.target.value)}
                className="w-full bg-transparent pl-6 py-1 font-medium text-[#112340] focus:outline-none"
              />
            </div>
          </label>
        </div>

        <div className="lg:px-4">
          <SelectField
            label="Distância do campus"
            icon={<MapPin className="w-4 h-4 text-amber-500" />}
            value={draft.maxDistance?.toString() ?? ''}
            onChange={(v) => set('maxDistance', v ? Number(v) : null)}
          >
            {DISTANCE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
            <option value="">Qualquer distância</option>
          </SelectField>
        </div>

        <button
          type="submit"
          className="group sm:col-span-2 lg:col-span-1 w-full lg:w-auto bg-[#112340] text-white px-6 py-3.5 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-[#1a365d] hover:shadow-lg hover:shadow-[#112340]/20 active:scale-[0.98] transition-all whitespace-nowrap"
        >
          Buscar moradia
          <ArrowUpRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </button>
      </div>
    </form>
  );
};

const Hero = ({ onSearch }: { onSearch: (f: Filters) => void }) => (
  <section id="topo">
    <Container className="pt-8 md:pt-12 pb-16 md:pb-20">
      <div className="grid lg:grid-cols-2 gap-10 lg:gap-12 items-center">
        <div className="max-w-2xl">
          <div className="animate-fade-up" style={delay(0)}>
            <Eyebrow>Para quem está chegando, para quem já é de casa</Eyebrow>
          </div>
          <h1
            className="animate-fade-up text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-[#112340] leading-[1.05] tracking-tight mb-6"
            style={delay(100)}
          >
            Sua vida na universidade começa com um lugar para chamar de{' '}
            <span className="relative inline-block text-[#204a87]">
              seu.
              <span
                className="absolute left-0 right-1 -bottom-1 h-1.5 rounded-full bg-amber-400/80 origin-left animate-grow-x"
                style={delay(900)}
              />
            </span>
          </h1>
          <p className="animate-fade-up text-base sm:text-lg text-slate-600 mb-8 max-w-lg leading-relaxed" style={delay(220)}>
            Quartos, repúblicas e apartamentos perto da USP, UNICAMP, UNESP, UFSCar, UFABC, Mackenzie, PUC-SP e outras
            faculdades paulistas, de acordo com o seu orçamento e estilo de vida.
          </p>
          <div className="animate-fade-up flex items-center gap-3 text-sm font-medium text-[#112340]" style={delay(340)}>
            <CheckCircle2 className="w-5 h-5 text-[#204a87] flex-shrink-0" />
            Um novo endereço. A mesma comunidade universitária.
          </div>
        </div>

        <div
          className="animate-scale-in relative h-[340px] sm:h-[420px] lg:h-[550px] w-full rounded-[2rem] lg:rounded-[2.5rem] overflow-hidden shadow-2xl"
          style={delay(150)}
        >
          <SmartImage
            eager
            src="https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1000&q=80"
            alt="Quarto de estudante iluminado"
            className="absolute inset-0"
            imgClassName="animate-ken-burns"
          />
          <div
            className="animate-fade-up absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6"
            style={delay(650)}
          >
            <div className="animate-float bg-white/95 backdrop-blur-md p-4 sm:p-5 rounded-2xl flex items-start gap-4 shadow-lg">
              <div className="bg-[#112340] p-2 rounded-lg text-white">
                <Search className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-[#112340]">Tem espaço para o seu começo.</h4>
                <p className="text-sm text-slate-500">Perto da aula. Perto de uma nova rotina.</p>
              </div>
            </div>
          </div>
          <div
            className="animate-fade-up absolute top-4 right-4 sm:top-6 sm:right-6 bg-white px-4 py-2 rounded-full text-xs font-bold text-[#112340] flex items-center gap-2 shadow-sm"
            style={delay(800)}
          >
            Capital e interior de SP <ArrowUpRight className="w-3 h-3" />
          </div>
        </div>
      </div>

      <div className="animate-fade-up" style={delay(450)}>
        <SearchWidget onSearch={onSearch} />
      </div>

      <div
        className="animate-fade-in flex flex-col sm:flex-row sm:flex-wrap items-center justify-center gap-4 sm:gap-8 mt-10 text-sm font-medium text-slate-500"
        style={delay(700)}
      >
        <div className="flex items-center gap-2"><FileText className="w-4 h-4" /> Aluguel e contas sem surpresa</div>
        <div className="flex items-center gap-2"><MapPin className="w-4 h-4" /> Principais campi paulistas no seu radar</div>
        <div className="flex items-center gap-2"><Users className="w-4 h-4" /> Gente na mesma fase que você</div>
      </div>
    </Container>
  </section>
);


interface PropertyCardProps {
  property: Property;
  favorite: boolean;
  onToggleFavorite: () => void;
  onOpen: () => void;
}

const PropertyCard = ({ property, favorite, onToggleFavorite, onOpen }: PropertyCardProps) => {
  const campus = campusById(property.campusId);
  return (
    <article
      onClick={onOpen}
      className="h-full bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-xl hover:shadow-[#112340]/10 hover:-translate-y-1 hover:border-slate-300 transition-all duration-500 ease-out-expo group cursor-pointer flex flex-col">
      <div className="relative h-52 sm:h-56 w-full">
        <SmartImage
          src={property.image}
          alt={property.title}
          className="absolute inset-0"
          imgClassName="group-hover:scale-[1.06]"
        />
        <span className="absolute top-4 left-4 bg-white/95 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-[#112340] shadow-sm">
          {property.tag}
        </span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite();
          }}
          aria-label={favorite ? 'Remover dos favoritos' : 'Salvar nos favoritos'}
          aria-pressed={favorite}
          className={`absolute top-4 right-4 p-2 bg-white rounded-full shadow-sm transition-all duration-300 hover:scale-110 active:scale-90 ${
            favorite ? 'text-red-500' : 'text-slate-400 hover:text-red-500'
          }`}
        >
          <Heart
            key={favorite ? 'on' : 'off'}
            className={`w-4 h-4 ${favorite ? 'animate-pop' : ''}`}
            fill={favorite ? 'currentColor' : 'none'}
          />
        </button>
      </div>

      <div className="p-5 flex flex-col flex-grow">
        <div className="text-xs font-medium text-slate-500 mb-1">{property.type}</div>
        <h3 className="font-bold text-lg text-[#112340] mb-3 leading-tight">{property.title}</h3>

        <div className="flex items-start gap-1.5 text-sm text-slate-600 mb-4 mt-auto">
          <MapPin className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <span>
            <strong className="font-semibold text-[#112340]">{property.neighborhood}</strong> · {km(property.distanceKm)} da{' '}
            {campus?.label}
          </span>
        </div>

        <div className="pt-4 border-t border-slate-100">
          <div className="flex items-baseline gap-1">
            <span className="font-bold text-2xl text-[#112340]">{brl(property.price)}</span>
            <span className="text-sm text-slate-500 font-medium">/ mês</span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {property.estimatedBills > 0
              ? `+ ${brl(property.estimatedBills)} estimados em contas`
              : 'Contas inclusas (confirme com o anunciante)'}
          </p>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpen();
            }}
            aria-haspopup="dialog"
            className="mt-4 w-full inline-flex items-center justify-center gap-2 text-sm font-semibold text-[#112340] border border-slate-200 rounded-xl py-2.5 group-hover:bg-[#112340] group-hover:text-white group-hover:border-[#112340] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#204a87] transition-all duration-300"
          >
            <MapIcon className="w-4 h-4" /> Ver detalhes e mapa
          </button>
        </div>
      </div>
    </article>
  );
};

interface PropertySectionProps {
  filters: Filters;
  onResetFilters: () => void;
}

const PropertySection = ({ filters, onResetFilters }: PropertySectionProps) => {
  const [quick, setQuick] = useState<QuickFilter>('Todos os campi');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [openId, setOpenId] = useState<string | null>(null);
  const [liveListings, setLiveListings] = useState<Property[]>([]);
  const allProperties = useMemo(() => [...liveListings, ...PROPERTIES], [liveListings]);
  const openProperty = allProperties.find((p) => p.id === openId) ?? null;
  const closeModal = useCallback(() => setOpenId(null), []);

  useEffect(() => {
    getPublishedListings()
      .then(setLiveListings)
      .catch(() => setLiveListings([]));
  }, []);

  const toggleFavorite = (id: string) =>
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const results = useMemo(() => {
    return allProperties.filter((p) => {
      const campus = campusById(p.campusId);
      if (filters.campusId !== 'all' && p.campusId !== filters.campusId) return false;
      if (filters.maxBudget !== null && p.price > filters.maxBudget) return false;
      if (filters.maxDistance !== null && p.distanceKm > filters.maxDistance) return false;
      if (quick === 'Até R$ 1.000') return p.price <= 1000;
      if (quick !== 'Todos os campi') return campus?.city === quick;
      return true;
    });
  }, [allProperties, filters, quick]);

  const hasSearch =
    filters.campusId !== 'all' || filters.maxBudget !== null || filters.maxDistance !== null || filters.moveDate !== '';

  const summary = [
    filters.campusId !== 'all' ? campusById(filters.campusId)?.label : null,
    filters.maxBudget !== null ? `até ${brl(filters.maxBudget)}` : null,
    filters.maxDistance !== null ? `até ${filters.maxDistance} km` : null,
    filters.moveDate
      ? `mudança em ${new Date(`${filters.moveDate}-02`).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}`
      : null,
  ].filter(Boolean);

  const resetAll = () => {
    setQuick('Todos os campi');
    onResetFilters();
  };

  return (
    <section id="moradias">
      <Container className="py-16">
        <Reveal className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <Eyebrow>Um endereço possível</Eyebrow>
            <h2 className="text-3xl md:text-4xl font-bold text-[#112340] mb-2">Moradias perto da faculdade</h2>
            <p className="text-slate-600">Do quarto só seu ao apê dividido: compare o que cabe na sua rotina.</p>
          </div>
          <a href="#moradias" className="group flex items-center gap-2 text-sm font-bold text-[#204a87] hover:text-[#112340] transition">
            Explorar todas as moradias{' '}
            <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
          </a>
        </Reveal>

        {hasSearch && (
          <div className="animate-fade-up flex flex-wrap items-center gap-2 mb-4 text-sm">
            <span className="text-slate-500">Sua busca:</span>
            {summary.map((s) => (
              <span key={s} className="px-3 py-1 bg-[#e8f0fe] text-[#112340] rounded-full font-medium">
                {s}
              </span>
            ))}
            <button onClick={onResetFilters} className="text-[#204a87] font-semibold hover:underline ml-1">
              Limpar busca
            </button>
          </div>
        )}

        <div className="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
          {QUICK_FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setQuick(f)}
              className={`px-4 py-2 text-sm font-medium rounded-full whitespace-nowrap transition-all duration-300 active:scale-95 ${
                quick === f
                  ? 'bg-[#112340] text-white shadow-md shadow-[#112340]/20'
                  : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {results.length > 0 ? (
          <div
            key={`${quick}-${filters.campusId}-${filters.maxBudget}-${filters.maxDistance}`}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {results.map((p, i) => (
              <Reveal key={p.id} delay={(i % 4) * 90} className="h-full">
                <PropertyCard
                  property={p}
                  favorite={favorites.has(p.id)}
                  onToggleFavorite={() => toggleFavorite(p.id)}
                  onOpen={() => setOpenId(p.id)}
                />
              </Reveal>
            ))}
          </div>
        ) : (
          <div className="animate-scale-in bg-white border border-dashed border-slate-300 rounded-2xl p-10 text-center">
            <Search className="w-8 h-8 text-slate-300 mx-auto mb-3" />
            <h3 className="font-bold text-[#112340] text-lg mb-1">Nenhuma moradia com esses filtros (ainda).</h3>
            <p className="text-slate-500 text-sm mb-5">Tente ampliar o orçamento, a distância ou ver outros campi.</p>
            <button
              onClick={resetAll}
              className="bg-[#112340] text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-[#1a365d] transition"
            >
              Ver todas as moradias
            </button>
          </div>
        )}

        {favorites.size > 0 && (
          <p className="animate-fade-up mt-6 text-sm text-slate-600 flex items-center gap-2">
            <Heart className="w-4 h-4 text-red-500" fill="currentColor" />
            {favorites.size} {favorites.size === 1 ? 'moradia salva' : 'moradias salvas'} nos favoritos.
          </p>
        )}

        <div className="mt-8 flex items-start gap-3 bg-[#f0eee5] p-4 rounded-xl text-xs text-slate-600">
          <Shield className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <p>
            Anúncios ilustrativos: fotos, valores, composição de moradores e distâncias são exemplos. Confirme custos e
            trajetos antes de decidir.
          </p>
        </div>
      </Container>

      {openProperty && (
        <PropertyModal
          property={openProperty}
          campus={campusById(openProperty.campusId)}
          favorite={favorites.has(openProperty.id)}
          onToggleFavorite={() => toggleFavorite(openProperty.id)}
          onClose={closeModal}
        />
      )}
    </section>
  );
};


const RepublicSection = () => (
  <section id="republicas">
    <Container className="py-16">
      <Reveal className="bg-[#f0ede5] rounded-[2rem] lg:rounded-[2.5rem] p-6 sm:p-8 md:p-12 grid lg:grid-cols-2 gap-10 lg:gap-12 items-center">
        <Reveal
          delay={150}
          className="group relative h-[320px] sm:h-[400px] md:h-[500px] rounded-3xl overflow-hidden order-2 lg:order-1"
        >
          <SmartImage
            src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1000&q=80"
            alt="Estudantes reunidos em casa"
            className="absolute inset-0"
            imgClassName="group-hover:scale-[1.04] !duration-[1200ms]"
          />
          <div className="animate-float absolute bottom-4 left-4 right-4 sm:right-auto sm:bottom-6 sm:left-6 bg-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-3">
            <Users className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span className="text-sm font-bold text-[#112340]">Dividir o aluguel. Somar companhia.</span>
          </div>
        </Reveal>

        <Reveal delay={250} className="order-1 lg:order-2">
          <Eyebrow>Mais que dividir as contas</Eyebrow>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#112340] mb-6 leading-tight">
            Encontre sua próxima república
          </h2>
          <p className="text-slate-600 mb-8 text-base sm:text-lg">
            De Barão Geraldo à Vargem Limpa, do Butantã a São Carlos: morar junto deixa o mês mais leve e a chegada menos
            solitária. Encontre uma casa com a sua cara e pessoas com uma rotina que combina com a sua.
          </p>

          <div className="space-y-6 mb-10">
            <div className="group flex gap-4 items-start">
              <div className="bg-white p-3 rounded-xl shadow-sm text-[#112340] transition-all duration-300 group-hover:-translate-y-0.5 group-hover:shadow-md group-hover:bg-[#112340] group-hover:text-white">
                <Home className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-[#112340] text-lg">Já existe um lugar para você</h4>
                <p className="text-slate-600 text-sm mt-1">Vagas em repúblicas tradicionais, mistas, femininas e masculinas.</p>
              </div>
            </div>
            <div className="group flex gap-4 items-start">
              <div className="bg-white p-3 rounded-xl shadow-sm text-[#112340] transition-all duration-300 group-hover:-translate-y-0.5 group-hover:shadow-md group-hover:bg-[#112340] group-hover:text-white">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-[#112340] text-lg">Ou uma casa para formar juntos</h4>
                <p className="text-slate-600 text-sm mt-1">Encontre colegas do seu curso ou campus para buscar e dividir um apê.</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <a
              href="#moradias"
              className="group bg-[#112340] text-white px-6 py-3.5 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-[#1a365d] hover:shadow-lg hover:shadow-[#112340]/20 hover:-translate-y-0.5 active:translate-y-0 transition-all"
            >
              Explorar repúblicas{' '}
              <ArrowUpRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </a>
            <button className="bg-transparent border-2 border-[#112340] text-[#112340] px-6 py-3.5 rounded-xl font-bold flex items-center justify-center hover:bg-[#112340] hover:text-white hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300">
              Encontrar colegas
            </button>
          </div>
        </Reveal>
      </Reveal>
    </Container>
  </section>
);


const BENEFITS = [
  {
    icon: Wallet,
    title: 'Seu bolso vem primeiro',
    text: 'Compare aluguel, condomínio e contas. Um valor que cabe no mês vale mais que um preço que esconde despesas.',
    tag: 'Orçamento de verdade',
  },
  {
    icon: MapPin,
    title: 'Menos perrengue no caminho',
    text: 'Considere o campus, os mercados e o transporte do bairro. A melhor distância também depende da sua rotina.',
    tag: 'Praticidade no dia a dia',
  },
  {
    icon: Coffee,
    title: 'Um começo com companhia',
    text: 'Encontre repúblicas e colegas que entendem a vida universitária, do primeiro semestre à semana de provas.',
    tag: 'Comunidade universitária',
  },
];

const BenefitsSection = () => (
  <section className="bg-[#112340] text-white py-16 md:py-20 mt-6">
    <Container>
      <Reveal className="flex flex-col md:flex-row md:items-end justify-between mb-12 md:mb-16 gap-6">
        <div>
          <Eyebrow tone="amber">A vida além da sala de aula</Eyebrow>
          <h2 className="text-3xl md:text-5xl font-bold">Feito para a vida universitária</h2>
        </div>
        <p className="text-slate-300 max-w-xs text-sm">
          Para calouros, veteranos e quem ainda está esperando a lista de aprovados.
        </p>
      </Reveal>

      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-10 md:gap-8">
        {BENEFITS.map(({ icon: Icon, title, text, tag }, i) => (
          <Reveal key={title} delay={i * 120} className="group">
            <div className="w-12 h-12 rounded-full border border-slate-700 flex items-center justify-center mb-6 transition-all duration-500 group-hover:border-amber-500 group-hover:bg-amber-500/10 group-hover:scale-110">
              <Icon className="w-5 h-5 text-amber-500 transition-transform duration-500 group-hover:rotate-[-8deg]" />
            </div>
            <h3 className="text-xl font-bold mb-3">{title}</h3>
            <p className="text-slate-400 text-sm leading-relaxed mb-4">{text}</p>
            <span className="text-amber-500 text-xs font-bold uppercase tracking-wider">{tag}</span>
          </Reveal>
        ))}
      </div>
    </Container>
  </section>
);


const STEPS = [
  {
    icon: GraduationCap,
    title: 'Defina campus e orçamento',
    text: 'Escolha onde vai estudar e quanto pode gastar por mês, já contando as contas.',
  },
  {
    icon: Scale,
    title: 'Compare custo e trajeto',
    text: 'Coloque lado a lado aluguel, contas, distância e transporte até o seu prédio de aula.',
  },
  {
    icon: MessageCircle,
    title: 'Converse e visite',
    text: 'Fale com anunciantes e moradores, tire dúvidas e visite o lugar (ou faça uma chamada de vídeo).',
  },
  {
    icon: KeyRound,
    title: 'Feche com segurança',
    text: 'Leia o contrato, confirme garantias e só pague depois de ver o imóvel. Aí é pegar a chave.',
  },
];

const HowItWorksSection = () => (
  <section id="como-funciona">
    <Container className="py-16 md:py-20">
      <Reveal className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
        <div>
          <Eyebrow>Passo a passo</Eyebrow>
          <h2 className="text-3xl md:text-5xl font-bold text-[#112340]">Da busca à chave</h2>
        </div>
        <p className="text-slate-600 max-w-sm text-sm">
          Um caminho simples para sair da aprovação e chegar ao seu novo endereço sem correria.
        </p>
      </Reveal>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" role="list">
        {STEPS.map(({ icon: Icon, title, text }, i) => (
          <Reveal key={title} delay={i * 110} className="h-full">
            <div
              role="listitem"
              className="group relative h-full overflow-hidden bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-xl hover:shadow-[#112340]/10 hover:-translate-y-1 hover:border-slate-300 transition-all duration-500 ease-out-expo"
            >
              <span className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-[#204a87] to-amber-400 origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500 ease-out-expo" />
              <div className="flex items-center justify-between mb-6">
                <div className="bg-[#e8f0fe] text-[#112340] p-3 rounded-xl transition-colors duration-300 group-hover:bg-[#112340] group-hover:text-white">
                  <Icon className="w-6 h-6" />
                </div>
                <span className="text-4xl font-extrabold text-slate-100 transition-colors duration-500 group-hover:text-amber-200">
                  0{i + 1}
                </span>
              </div>
              <h3 className="font-bold text-lg text-[#112340] mb-2">{title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{text}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </Container>
  </section>
);


const CityCard = ({ city }: { city: City }) => (
  <article className="group h-full bg-white rounded-[2rem] overflow-hidden border border-slate-200 shadow-sm hover:shadow-xl hover:shadow-[#112340]/10 hover:-translate-y-1 transition-all duration-500 ease-out-expo flex flex-col">
    <div className="h-52 sm:h-60 relative">
      <SmartImage src={city.image} alt={city.name} className="absolute inset-0" imgClassName="group-hover:scale-[1.05] !duration-[1200ms]" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#112340]/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="absolute top-4 left-4 bg-white/95 backdrop-blur px-3 py-1.5 rounded-full text-xs font-bold text-[#112340] flex items-center gap-1.5 shadow-sm">
        <MapPin className="w-3.5 h-3.5" /> {city.name}
      </div>
    </div>
    <div className="p-6 sm:p-8 flex flex-col flex-grow">
      <div className="flex items-center justify-between mb-2 gap-3">
        <h3 className="text-2xl sm:text-3xl font-bold text-[#112340]">{city.name}</h3>
        <span className="w-11 h-11 flex-shrink-0 rounded-full bg-slate-100 flex items-center justify-center text-[#112340] font-bold text-xs">
          {city.abbr}
        </span>
      </div>
      <p className="text-emerald-600 text-sm font-medium mb-4">{city.subtitle}</p>
      <p className="text-slate-600 text-sm mb-6 flex-grow">{city.desc}</p>

      <div className="flex gap-2 flex-wrap mb-6">
        {city.tags.map((tag) => (
          <span key={tag} className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded-full">
            {tag}
          </span>
        ))}
      </div>

      <div className="flex items-start gap-3 pt-6 border-t border-slate-100">
        <div className="bg-amber-100 p-1.5 rounded text-amber-700 mt-0.5">
          <MapPin className="w-4 h-4" />
        </div>
        <p className="text-xs text-slate-500 leading-relaxed">{city.transport}</p>
      </div>

      <a
        href="#moradias"
        className="group/link inline-flex items-center gap-2 text-sm font-bold text-[#204a87] mt-8 hover:text-[#112340] transition"
      >
        Ver moradias em {city.name}{' '}
        <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover/link:translate-x-1" />
      </a>
    </div>
  </article>
);

const CitySection = () => (
  <section id="cidades">
    <Container className="py-16 md:py-20">
      <Reveal className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
        <div>
          <Eyebrow>Se localiza por aqui</Eyebrow>
          <h2 className="text-3xl md:text-5xl font-bold text-[#112340]">Vários campi. Novos caminhos.</h2>
        </div>
        <p className="text-slate-600 max-w-sm text-sm">
          Conheça o entorno antes de escolher seu endereço. Seu dia a dia acontece entre a casa e o campus.
        </p>
      </Reveal>

      <div className="grid sm:grid-cols-2 gap-6 md:gap-8">
        {CITIES.map((city, i) => (
          <Reveal key={city.id} delay={(i % 2) * 120} className="h-full">
            <CityCard city={city} />
          </Reveal>
        ))}
      </div>

      <Reveal className="mt-8 bg-emerald-50 text-emerald-800 p-5 rounded-2xl text-sm font-medium flex items-start sm:items-center gap-3">
        <MapPin className="w-5 h-5 flex-shrink-0" />
        Distância no mapa não conta tudo: visite o bairro, observe iluminação e movimento e teste o caminho de volta da aula.
      </Reveal>
    </Container>
  </section>
);


const FAQSection = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="border-t border-slate-200">
      <Container className="py-16 md:py-20">
        <div className="grid lg:grid-cols-[1fr_1.3fr] gap-10 lg:gap-16">
          <Reveal className="lg:sticky lg:top-28 lg:self-start">
            <Eyebrow>Antes de fazer as malas</Eyebrow>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#112340] mb-6 leading-tight">
              Dúvidas de quem está chegando.
            </h2>
            <p className="text-slate-600 mb-8 text-base sm:text-lg">
              Respostas para quem vai estudar em São Paulo, Campinas, Bauru, São Carlos, no ABC ou em outras cidades do estado.
            </p>
            <a href="#faq" className="group inline-flex items-center gap-2 text-sm font-bold text-[#204a87] hover:text-[#112340] transition">
              Central de ajuda <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
            </a>
          </Reveal>

          <div>
            {FAQ.map((item, i) => {
              const isOpen = openIndex === i;
              return (
                <Reveal key={item.q} delay={i * 60} className="border-b border-slate-200">
                  <button
                    onClick={() => setOpenIndex(isOpen ? null : i)}
                    aria-expanded={isOpen}
                    className="w-full py-5 flex justify-between items-center gap-4 text-left group"
                  >
                    <h3
                      className={`font-bold text-base sm:text-lg transition-colors duration-300 group-hover:text-[#204a87] ${
                        isOpen ? 'text-[#204a87]' : 'text-[#112340]'
                      }`}
                    >
                      {item.q}
                    </h3>
                    <span
                      className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                        isOpen
                          ? 'bg-[#112340] text-white rotate-45'
                          : 'bg-slate-100 text-slate-500 group-hover:bg-[#e8f0fe] group-hover:text-[#204a87]'
                      }`}
                    >
                      <Plus className="w-4 h-4" />
                    </span>
                  </button>
                  <div
                    className={`grid transition-all duration-500 ease-out-expo ${
                      isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                    }`}
                  >
                    <div className="overflow-hidden">
                      <p
                        className={`pb-5 pr-10 text-slate-600 text-sm leading-relaxed transition-transform duration-500 ease-out-expo ${
                          isOpen ? 'translate-y-0' : '-translate-y-2'
                        }`}
                      >
                        {item.a}
                      </p>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </Container>
    </section>
  );
};


const CTASection = () => (
  <section className="bg-[#e4ebdd] py-20 md:py-24 text-center">
    <Container>
      <Reveal className="flex flex-col items-center">
        <Eyebrow tone="emerald">Seu lugar nessa nova fase</Eyebrow>
        <h2 className="text-3xl sm:text-4xl md:text-6xl font-bold text-[#112340] mb-6 max-w-3xl leading-tight">
          Seu próximo capítulo tem um endereço.
        </h2>
        <p className="text-slate-700 mb-10 max-w-xl text-base sm:text-lg">
          Para estudantes e ingressantes das faculdades paulistas. Comece pelo seu orçamento e encontre um jeito de morar
          que combine com você.
        </p>
        <a
          href="#topo"
          className="group bg-[#112340] text-white px-8 py-4 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-[#1a365d] hover:-translate-y-0.5 hover:shadow-xl hover:shadow-[#112340]/25 active:translate-y-0 transition-all duration-300 text-lg shadow-lg"
        >
          Encontrar meu lugar{' '}
          <ArrowUpRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </a>
        <p className="mt-6 text-sm text-emerald-800 font-medium">São Paulo, ABC, Campinas, Bauru, São Carlos e interior.</p>
      </Reveal>
    </Container>
  </section>
);

const FOOTER_COLUMNS = [
  {
    title: 'Encontre seu lugar',
    links: [
      { label: 'Moradias perto da USP', href: '#moradias' },
      { label: 'Moradias perto da UNICAMP', href: '#moradias' },
      { label: 'Moradias perto da UNESP', href: '#moradias' },
      { label: 'Repúblicas e quartos', href: '#republicas' },
    ],
  },
  {
    title: 'Prepare sua mudança',
    links: [
      { label: 'Da busca à chave', href: '#como-funciona' },
      { label: 'Conheça as cidades', href: '#cidades' },
      { label: 'Dicas de convivência', href: '#republicas' },
      { label: 'Perguntas frequentes', href: '#faq' },
    ],
  },
  {
    title: 'Vamos conversar',
    links: [
      { label: 'Sobre a UNIdus', href: '#topo' },
      { label: 'Anunciar uma moradia', href: '#topo' },
      { label: 'Central de ajuda', href: '#faq' },
      { label: 'Fale com a gente', href: '#faq' },
    ],
  },
];

const Footer = () => (
  <footer className="bg-[#112340] text-white pt-16 md:pt-20 pb-8">
    <Container>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12 mb-14 md:mb-16">
        <div>
          <a
            href="#topo"
            aria-label="Voltar ao topo"
            className="group inline-block bg-white px-3 py-2 rounded-xl mb-6 shadow-lg shadow-black/10 hover:-translate-y-0.5 transition-transform duration-300"
          >
            <Logo className="h-10 w-auto" />
          </a>
          <h3 className="text-xl font-bold mb-4">Morar bem também faz parte de estudar.</h3>
          <p className="text-slate-400 text-sm leading-relaxed">
            Moradia para a comunidade de estudantes atuais e ingressantes das faculdades do estado de São Paulo.
          </p>
        </div>

        {FOOTER_COLUMNS.map((col) => (
          <div key={col.title}>
            <h4 className="font-bold mb-6">{col.title}</h4>
            <ul className="space-y-4 text-sm text-slate-400">
              {col.links.map((l) => (
                <li key={l.label}>
                  <a
                    href={l.href}
                    className="inline-block hover:text-white hover:translate-x-1 transition-all duration-300"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-slate-700 pt-8 flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-slate-400 text-center md:text-left">
        <p>
          © 2026 UNIdus. Um lugar para começar.
          <br />
          Plataforma independente, sem vínculo oficial com as universidades citadas.
        </p>
        <div className="flex items-center gap-6">
          <a href="#termos" className="hover:text-white transition">Termos de uso</a>
          <a href="#privacidade" className="hover:text-white transition">Privacidade</a>
          <a
            href="#topo"
            aria-label="Instagram da UNIdus"
            className="hover:text-white hover:scale-110 hover:-rotate-6 transition-all duration-300"
          >
            <Instagram className="w-5 h-5" />
          </a>
        </div>
      </div>
    </Container>
  </footer>
);


const AppDialogs = () => {
  const { main, legal, closeMain, closeLegal, openDialog } = useDialogs();
  const { user, profile } = useAuth();
  const promptedFor = useRef<string | null>(null);

  useEffect(() => {
    if (user && profile === null && promptedFor.current !== user.id) {
      promptedFor.current = user.id;
      openDialog('login');
    }
  }, [user, profile, openDialog]);

  return (
    <>
      {(main === 'login' || main === 'account') && <AccountDialog onClose={closeMain} />}
      {main === 'listing' && <ListingDialog onClose={closeMain} />}
      {legal && <LegalDialog doc={legal} onClose={closeLegal} />}
    </>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <DialogsProvider>
        <AppContent />
        <AppDialogs />
      </DialogsProvider>
    </AuthProvider>
  );
}

function AppContent() {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);

  return (
    <div className="min-h-screen bg-[#f7f7f5] text-slate-900 font-sans selection:bg-[#204a87] selection:text-white">
      <Navbar />
      <main>
        <Hero onSearch={setFilters} />
        <PropertySection filters={filters} onResetFilters={() => setFilters(DEFAULT_FILTERS)} />
        <RepublicSection />
        <BenefitsSection />
        <HowItWorksSection />
        <CitySection />
        <FAQSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
