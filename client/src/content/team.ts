import { withBase } from "@/lib/base";
import type { TeamMember } from "./types";

export const teamIntro = {
  titleStart: "Четыре",
  titleAccent: "оптики.",
  text: "Небольшая команда без передачи проекта через пять уровней менеджмента. Люди, с которыми вы обсуждаете задачу, участвуют и в её реализации.",
  note: "4 × human intelligence",
};

/**
 * Roles are described through value for the project, not through a CV.
 * All four confirmed by the client (18.09.2026). The engineering scope of
 * Boris and Nikita comes from the project review the client supplied.
 */
export const team: TeamMember[] = [
  {
    id: "D-04",
    name: "Арсений",
    role: "FOUNDER / SALES / CLIENT ACQUISITION",
    bio: "Основатель DMO и первый, с кем вы разговариваете. Отвечает за продажи, поиск и привлечение клиентов, развитие партнёрств.",
    skills: ["sales", "clients", "partnerships"],
    portrait: "portrait-d",
    image: withBase("/team/arseniy.webp"),
    imageAlt: "Арсений — основатель DMO, отвечает за продажи и клиентов",
  },
  {
    id: "D-03",
    name: "Матвей",
    role: "PROJECT MANAGEMENT / PROCESS / COMMUNICATION",
    bio: "10 лет ведёт маркетинговые проекты. Отвечает за то, чтобы договорённости превращались в план работ, сроки и понятный результат, а не в переписку без итога.",
    skills: ["project", "process", "communication"],
    portrait: "portrait-c",
    image: withBase("/team/matvey.webp"),
    imageAlt: "Матвей — проджект-менеджер DMO",
  },
  {
    id: "D-01",
    name: "Борис",
    role: "AI / SYSTEMS / AUTOMATION",
    bio: "Строит то, что продолжает работать без присмотра: AI-пайплайны, фоновые очереди, интеграции с Telegram и внешними сервисами. Повторные попытки, ограничение нагрузки и разграничение доступа закладывает до запуска, а не после первого сбоя.",
    skills: ["ai", "automation", "pipelines", "backend"],
    portrait: "portrait-a",
    image: withBase("/team/boris.webp"),
    imageAlt: "Борис — отвечает за AI-интеграции и внутренние системы DMO",
  },
  {
    id: "D-02",
    name: "Никита",
    role: "FULL-STACK / PRODUCT / E-COMMERCE",
    bio: "Собирает продукт целиком — каталог, заказы, оплату, админку и личные кабинеты. Доводит до состояния, в котором заказчик управляет системой сам, а AI работает внутри сценария, а не отдельной кнопкой.",
    skills: ["fullstack", "product", "ecommerce", "checkout"],
    portrait: "portrait-b",
    image: withBase("/team/nikita.webp"),
    imageAlt: "Никита — full-stack разработчик DMO",
  },
];
