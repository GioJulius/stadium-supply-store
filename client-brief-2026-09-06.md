# Client messages — 6 September 2026 (WhatsApp)

Captured from the Stadium Supply chat on 6 Sep 2026. Nothing below is
implemented yet.

## 1. Order cut-off changed — orders are placed every Friday

> "please also note that we changed when placing orders, orders will be placed
> every friday" — 9:17 AM

The policy text puts the cut-off at **Friday 12:00 PM**. The storefront and the
product pages say nothing about a weekly batch or a cut-off; this needs to be
visible before checkout, not only in the policy page.

## 2. Return & refund policy — sent in full, needs a page

Sent 9:16 AM. Verbatim:

> **RETURN & REFUND POLICY**
>
> At Stadium Supply, all orders are placed in weekly batches. Please read the
> following policy carefully before placing your order.
>
> **NO REFUNDS AFTER ORDERS ARE PLACED**
>
> Once your order has been placed with our supplier, we do not offer refunds or
> cancellations.
>
> Orders are placed every Friday at 12:00 PM. After this cut-off, your order is
> processed and the product is on its way. For this reason, we are unable to
> cancel the order or issue a refund once the order has been placed.
>
> **SIZE CHANGES & RETURNS**
>
> We do not accept returns or exchanges due to incorrect size selection.
>
> All products are ordered according to the size selected by the customer when
> placing the order. Customers are responsible for selecting the correct size.
>
> Please take note of our size guide before playing your order.
>
> We cannot be held responsible if a customer selects the incorrect size.
>
> **FAULTY OR INCORRECT PRODUCTS**
>
> A return or replacement will only be considered if:
>
> We sent you the wrong product or incorrect item; or
>
> The product has a manufacturing fault or defect.
>
> If you believe your order is faulty or incorrect, please contact us as soon as
> possible after receiving your order and provide clear photographs/videos
> showing the issue.
>
> We will assess the issue and, where applicable, arrange a suitable replacement
> or other appropriate resolution.
>
> **IMPORTANT**
>
> By placing an order with Stadium Supply, you acknowledge and agree to this
> Return & Refund Policy, including our no-refund policy after orders have been
> placed and our responsibility for selecting the correct size.
>
> Please ensure that you have checked your size, product and order details
> carefully before payment.

Two things to raise with the client before this goes live:

- "Please take note of our size guide before **playing** your order" — typo for
  *placing*.
- "**our responsibility** for selecting the correct size" in the IMPORTANT
  paragraph reads as the opposite of what the policy says everywhere else. It
  should be *the customer's responsibility*. As written it concedes liability.

## 3. A size guide image was sent — 4:21 PM

> "also note we do have this size guide if necessary"

A garment measurement table. Worth a proper size-guide page linked from every
product page, especially now the policy hangs refusals on the customer having
checked it. The image itself still has to be pulled off the chat.

## 4. Payment/verification is blocked on the client's side — 4:00–4:03 PM

The client sent a screenshot reading **"We're verifying your business"** with
"when i click it just shows this". That is a payment-provider onboarding screen
on their account, not a storefront fault. Nothing to fix in the code; they need
to finish the provider's business verification.

## 5. New stock: a "full zip" album, 9:12 AM

An album captioned **full zip** with a `+9` overlay, so **12 photographs** —
unimported. This is the next batch and it is not part of `supplied-batch-2026-09-05`.

Note the client's price table has **jacket R1 000** and **training set R600** and
nothing in between, which is the same gap that left five full-zip tracksuits
unpriced in the 4 Sep batch (see `stadium-supply-0904c-wave2`). Worth asking the
price at the same time as the batch is pulled.
