import { describe, expect, it } from "vitest";
import { CONTACT_WHATSAPP_MESSAGE, instagramUrl, whatsappUrl } from "@/features/settings/contact-links";
import { visibleTestimonials, type Testimonial } from "@/features/testimonials/testimonials";

const testimonial = (id: string, demo: boolean): Testimonial => ({
  id,
  name: "Nome",
  location: null,
  text: "Texto",
  rating: null,
  demo,
});

describe("visibleTestimonials", () => {
  const list = [testimonial("real", false), testimonial("exemplo", true)];

  it("remove os depoimentos de exemplo quando não podem aparecer", () => {
    expect(visibleTestimonials(list, { includeDemo: false }).map((t) => t.id)).toEqual(["real"]);
  });

  it("mantém todos durante o desenvolvimento", () => {
    expect(visibleTestimonials(list, { includeDemo: true })).toHaveLength(2);
  });
});

describe("links de contato", () => {
  it("Instagram aceita o usuário com ou sem @", () => {
    expect(instagramUrl("croquiseflores")).toBe("https://www.instagram.com/croquiseflores/");
    expect(instagramUrl("@croquiseflores")).toBe("https://www.instagram.com/croquiseflores/");
  });

  it("WhatsApp usa só os dígitos do número", () => {
    expect(whatsappUrl("+55 (11) 91234-5678")).toBe("https://wa.me/5511912345678");
  });

  it("WhatsApp do site já abre com uma mensagem carinhosa", () => {
    const url = whatsappUrl("5575988498356", CONTACT_WHATSAPP_MESSAGE);
    expect(decodeURIComponent(url.split("text=")[1])).toBe(CONTACT_WHATSAPP_MESSAGE);
    expect(CONTACT_WHATSAPP_MESSAGE).toContain("🌸");
  });
});
