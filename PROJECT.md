# PROJECT: Sahay

## Product

Sahay is a citizen-facing prototype that simplifies the first-response experience for online financial fraud in India.

It is **not** an official government service.

## Core principle

Collect the information investigators need without making citizens understand the investigator's mental model.

## Primary journey

Landing  
→ I lost money  
→ Assisted/manual choice  
→ Incident details  
→ Evidence  
→ Review  
→ Mock submission  
→ Status  
→ What happens next

## AI principle

AI is **not** the primary interface.

AI is an optional assisted-entry mechanism that converts a citizen's natural-language description into structured reporting fields.

The citizen must review and confirm every extracted field.

Manual entry must always remain available.

## Data

Use synthetic data only.

Never request:

- Real Aadhaar
- Real PAN
- Real bank account information
- Real OTPs
- Real payment information
- Real government credentials

Never connect to:

- NCRP
- Banks
- UPI
- Government APIs

## Design

| Token | Value |
| --- | --- |
| Primary | `#12304A` |
| Background | `#F7F8F6` |
| Surface | `#FFFFFF` |
| Text | `#172027` |
| Secondary text | `#5F6B73` |
| Border | `#D9DEE2` |
| Accent | `#D9822B` |

- Use Noto Sans or Inter.
- Follow an 8px spacing system.
- Use 6–8px border radii.
- Do not use gradients, glassmorphism, excessive shadows, purple AI styling, chatbot UI, fake government logos, or unnecessary animations.

## UX

- Mobile first.
- Use plain language.
- Every form must have a label, useful helper text, validation, error states, and success states.
- Never use color alone to communicate status.

## Scope

Only the financial-fraud journey is fully implemented.

Other categories can be informational or placeholders.

## Coding

- Preserve existing components and design tokens.
- Prefer editing existing components over creating duplicates.
- Do not add dependencies unless necessary.
- Do not rewrite working code unnecessarily.
