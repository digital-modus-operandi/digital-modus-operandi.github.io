import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import {
  ArrowUpRight,
  Command,
  Loader2,
  Mail,
  Send,
  TriangleAlert,
} from "lucide-react";
import { track } from "@/lib/analytics";
import {
  attributionSource,
  getAttribution,
  submitLead,
  type LeadPayload,
} from "@/lib/leads";
import { Link } from "wouter";
import { brand, finalCta, primaryCta } from "@/content/site";

type Fields = {
  name: string;
  contact: string;
  task: string;
  link: string;
  honey_ref: string;
};

type Errors = Partial<Record<keyof Fields, string>>;

const EMPTY: Fields = {
  name: "",
  contact: "",
  task: "",
  link: "",
  honey_ref: "",
};

/** Off-screen but still announced — the stylesheet needs no new class. */
const srOnly: CSSProperties = {
  position: "absolute",
  width: 1,
  height: 1,
  margin: -1,
  padding: 0,
  overflow: "hidden",
  clip: "rect(0 0 0 0)",
  clipPath: "inset(50%)",
  whiteSpace: "nowrap",
  border: 0,
};

/** Spoken names of the fields, used by the error summary. */
const FIELD_NAMES: Record<keyof Fields, string> = {
  name: "как вас зовут",
  contact: "куда ответить",
  task: "что происходит",
  link: "сайт или ссылка",
  honey_ref: "",
};

/**
 * Единственное, что говорим при сбое отправки. Предлагать человеку самому
 * пересылать текст в мессенджер — перекладывать нашу поломку на него: либо
 * заявка ушла, либо это техническая ошибка и есть запасной адрес.
 */
const FAILED_LEAD =
  "Техническая ошибка — заявка не отправилась. Отправьте задачу на почту";
const FAILED_MESSAGE = `${FAILED_LEAD} ${brand.email}.`;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const TELEGRAM_RE =
  /^(@[a-zA-Z0-9_]{4,}|(https?:\/\/)?t\.me\/[a-zA-Z0-9_+]{4,})$/;
const PHONE_RE = /^\+?[\d\s()-]{7,}$/;

function validate(values: Fields): Errors {
  const errors: Errors = {};

  if (values.name.trim().length < 2) {
    errors.name = "Укажите имя — так понятно, к кому обращаться.";
  }

  const contact = values.contact.trim();
  if (!contact) {
    errors.contact = "Нужен email или Telegram, чтобы ответить.";
  } else if (
    !EMAIL_RE.test(contact) &&
    !TELEGRAM_RE.test(contact) &&
    !PHONE_RE.test(contact)
  ) {
    errors.contact =
      "Похоже на опечатку. Например: name@company.ru или @username.";
  }

  if (values.task.trim().length < 15) {
    errors.task =
      "Пары слов о процессе достаточно, но не меньше — иначе нечего разбирать.";
  }

  return errors;
}

export default function Contact() {
  const [values, setValues] = useState<Fields>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [state, setState] = useState<"idle" | "sending" | "sent" | "fallback">(
    "idle"
  );
  const [startedTracked, setStartedTracked] = useState(false);
  const mountedAt = useRef(Date.now());
  /** Announced by the live region; remounted on every attempt so it re-fires. */
  const [alert, setAlert] = useState("");
  const [attempt, setAttempt] = useState(0);
  /** Set after a failed submit — focus moves once the errors are in the DOM. */
  const [focusField, setFocusField] = useState<keyof Fields | null>(null);
  const doneRef = useRef<HTMLDivElement>(null);

  /**
   * Focusing inside the submit handler would put the caret on the input before
   * React had rendered aria-describedby, so the error text stayed unspoken.
   * This effect runs after the commit, when the description already exists.
   */
  useEffect(() => {
    if (!focusField) return;
    document.getElementById(`field-${focusField}`)?.focus();
    setFocusField(null);
  }, [focusField]);

  useEffect(() => {
    if (state === "sent") doneRef.current?.focus();
  }, [state]);

  useEffect(() => {
    mountedAt.current = Date.now();
  }, []);

  const payload = useMemo<LeadPayload>(
    () => ({
      name: values.name.trim(),
      contact: values.contact.trim(),
      task: values.task.trim(),
      link: values.link.trim() || undefined,
      honey_ref: values.honey_ref,
      elapsedMs: Date.now() - mountedAt.current,
      attribution: getAttribution(),
      page: typeof window === "undefined" ? "" : window.location.href,
    }),
    [values]
  );

  const setField =
    (field: keyof Fields) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = event.target.value;
      setValues(current => ({ ...current, [field]: value }));
      // Clear the error as soon as the visitor starts fixing it — input is never reset.
      setErrors(current =>
        current[field] ? { ...current, [field]: undefined } : current
      );

      if (!startedTracked) {
        setStartedTracked(true);
        track("contact_start", {
          section: "contact",
          source: attributionSource(),
        });
      }
    };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validate(values);
    setErrors(nextErrors);
    setAttempt(value => value + 1);
    const invalid = Object.keys(nextErrors) as (keyof Fields)[];
    if (invalid.length > 0) {
      setAlert(
        `Форма не отправлена. Проверьте ${invalid.length === 1 ? "поле" : "поля"}: ${invalid
          .map(field => FIELD_NAMES[field])
          .join(", ")}.`
      );
      setFocusField(invalid[0]);
      return;
    }

    setAlert("");

    setState("sending");
    const result = await submitLead(payload);

    if (result.ok) {
      setState("sent");
      setAlert("");
      track("contact_submit", {
        section: "contact",
        source: attributionSource(payload.attribution),
      });
      return;
    }

    if (result.reason === "not_configured" || result.reason === "network") {
      setState("fallback");
      setAlert(FAILED_MESSAGE);
      return;
    }

    const message =
      result.reason === "rate_limited"
        ? `Слишком много отправок подряд. Подождите минуту или отправьте задачу на ${brand.email}.`
        : FAILED_MESSAGE;
    setState("idle");
    setErrors({ task: message });
    setAlert(message);
    setFocusField("task");
  };

  return (
    <section
      id="contact"
      className="contact section-pad"
      aria-labelledby="contact-title"
    >
      <div className="contact-signal" aria-hidden="true">
        <div className="signal-ring ring-a" />
        <div className="signal-ring ring-b" />
        <div className="signal-core">
          <Command size={25} strokeWidth={1.1} />
        </div>
      </div>
      <div className="section-heading reveal">
        <span className="section-index">// 09</span>
        <span className="mono">РАЗОБРАТЬ ЗАДАЧУ / CONTACT</span>
        <span className="heading-note">{finalCta.responseNote}</span>
      </div>
      <div className="contact-layout">
        <div className="contact-title reveal">
          <h2 className="display" id="contact-title">
            {finalCta.titleStart}
            <br />
            <em>{finalCta.titleAccent}</em>
          </h2>
          <p className="contact-subline">{finalCta.titleEnd}</p>
          <p>{finalCta.description}</p>
          <div className="contact-links">
            <a
              href={brand.telegramPersonUrl}
              onClick={() =>
                track("telegram_click", {
                  section: "contact",
                  source: "person",
                })
              }
            >
              <Send size={17} aria-hidden="true" /> Написать менеджеру в
              телеграм —{" "}
              {brand.telegramPerson}
            </a>
            <a
              href={`mailto:${brand.email}`}
              onClick={() =>
                track("email_click", { section: "contact", source: "email" })
              }
            >
              <Mail size={17} aria-hidden="true" /> Написать на почту —{" "}
              {brand.email}
            </a>
          </div>
        </div>

        {state === "sent" ? (
          // Без `reveal`: блок появляется на месте формы, которая уже на
          // экране. Со скролл-анимацией он стартовал бы прозрачным, а
          // наблюдатель его уже не ждёт — интерфейс просто исчезал бы.
          <div
            className="contact-form form-done"
            role="status"
            ref={doneRef}
            tabIndex={-1}
            style={{ outline: "none" }}
          >
            <span className="mono">ЗАЯВКА ПРИНЯТА</span>
            <h3>Спасибо — мы получили ваш контекст.</h3>
            <p>
              Ответим на {payload.contact} в течение 1–2 рабочих дней. В первом
              письме зададим несколько вопросов о процессе, чтобы разговор был
              предметным.
            </p>
            <p className="form-note">
              Если ответа не будет — напишите напрямую в Telegram{" "}
              {brand.telegramPerson}.
            </p>
          </div>
        ) : (
          <form
            className="contact-form reveal delay-1"
            onSubmit={handleSubmit}
            noValidate
          >
            {/* Announces the outcome of a failed submit, wherever focus is. */}
            <p key={attempt} role="alert" style={srOnly}>
              {alert}
            </p>

            <label htmlFor="field-name">
              <span className="mono">01 / КАК ВАС ЗОВУТ</span>
              <input
                id="field-name"
                name="name"
                value={values.name}
                onChange={setField("name")}
                placeholder="Имя и компания"
                autoComplete="organization"
                aria-invalid={Boolean(errors.name)}
                aria-describedby={errors.name ? "error-name" : undefined}
              />
              {errors.name && (
                <span className="field-error mono" id="error-name">
                  {errors.name}
                </span>
              )}
            </label>

            <label htmlFor="field-contact">
              <span className="mono">02 / КУДА ОТВЕТИТЬ</span>
              <input
                id="field-contact"
                name="contact"
                value={values.contact}
                onChange={setField("contact")}
                placeholder="you@company.ru или @username"
                autoComplete="email"
                aria-invalid={Boolean(errors.contact)}
                aria-describedby={errors.contact ? "error-contact" : undefined}
              />
              {errors.contact && (
                <span className="field-error mono" id="error-contact">
                  {errors.contact}
                </span>
              )}
            </label>

            <label htmlFor="field-task">
              <span className="mono">03 / ЧТО ПРОИСХОДИТ</span>
              <textarea
                id="field-task"
                name="task"
                value={values.task}
                onChange={setField("task")}
                placeholder="Как сейчас приходят заявки, где теряется время, какие системы уже используете"
                rows={3}
                aria-invalid={Boolean(errors.task)}
                aria-describedby={errors.task ? "error-task" : undefined}
              />
              {errors.task && (
                <span className="field-error mono" id="error-task">
                  {errors.task}
                </span>
              )}
            </label>

            <label htmlFor="field-link">
              <span className="mono">04 / САЙТ ИЛИ ССЫЛКА — НЕОБЯЗАТЕЛЬНО</span>
              <input
                id="field-link"
                name="link"
                value={values.link}
                onChange={setField("link")}
                placeholder="company.ru"
                autoComplete="url"
              />
            </label>

            {/* Honeypot: invisible to people, irresistible to bots. */}
            <div className="honeypot" aria-hidden="true">
              <label htmlFor="field-honey-ref">Не заполняйте это поле</label>
              <input
                id="field-honey-ref"
                name="honey_ref"
                value={values.honey_ref}
                onChange={setField("honey_ref")}
                tabIndex={-1}
                autoComplete="off"
              />
            </div>

            <button
              className="button button-primary magnetic"
              type="submit"
              disabled={state === "sending"}
            >
              {state === "sending" ? (
                <>
                  Отправляем{" "}
                  <Loader2 size={18} className="spin" aria-hidden="true" />
                </>
              ) : (
                <>
                  {primaryCta} <ArrowUpRight size={18} aria-hidden="true" />
                </>
              )}
            </button>

            <p className="form-note" style={{ marginTop: "0.75rem", fontSize: "0.825rem", opacity: 0.8 }}>
              Отправляя форму, вы соглашаетесь с{" "}
              <Link href="/privacy" style={{ textDecoration: "underline" }}>Политикой конфиденциальности</Link>{" "}
              и{" "}
              <Link href="/terms" style={{ textDecoration: "underline" }}>Условиями использования</Link>.
            </p>

            {state === "fallback" && (
              // Роли здесь нет намеренно: об ошибке уже объявляет скрытый
              // role="alert" выше, иначе она прозвучала бы дважды.
              <p className="form-fallback">
                <TriangleAlert size={14} aria-hidden="true" /> {FAILED_LEAD}{" "}
                <a href={`mailto:${brand.email}`}>{brand.email}</a>
              </p>
            )}
          </form>
        )}
      </div>
    </section>
  );
}
