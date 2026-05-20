/*
 * Mibera belt — Envio handler registration entrypoint (Deployment #1).
 *
 * The belt-scoped counterpart to src/EventHandlers.ts. config.mibera.yaml points
 * both belt contracts' `handler:` field at this file. Importing the two Mibera
 * handler modules runs their registration calls — each exported handler const is
 * a `MiberaLiquidBacking.<Event>.handler(...)` / `MiberaCollection.Transfer
 * .handler(...)` expression — and nothing else.
 *
 * Why a separate entrypoint (review finding DISS-001): src/EventHandlers.ts is the
 * monolith barrel — it statically imports all 31 handler modules. A scoped
 * `envio codegen --config config.mibera.yaml` generates the `generated` namespace
 * for only the two belt contracts, so loading the monolith barrel would fail on
 * the other 39 contracts' handler modules (their `generated` value imports would
 * be unresolved). This entrypoint loads only the Mibera handlers, whose `generated`
 * value imports (MiberaLiquidBacking, MiberaCollection) are in the belt config and
 * whose other imports are pure (lib/actions — type-only `generated` import;
 * lib/mint-detection, handlers/constants — no `generated` import).
 *
 * Handler *logic* (src/handlers/mibera-*.ts) is reused unchanged — SDD §3.2. This
 * file is additive registration scaffolding; per-belt entrypoints are the
 * factory-model norm (HoneyJar/Purupuru/Sprawl belts each get their own).
 */

// Mibera Liquid Backing handlers (loans, RFV, defaulted NFT marketplace)
import {
  handleLoanReceived,
  handleBackingLoanPayedBack,
  handleBackingLoanExpired,
  handleItemLoaned,
  handleLoanItemSentBack,
  handleItemLoanExpired,
  handleItemPurchased,
  handleItemRedeemed,
  handleRFVChanged,
} from "./handlers/mibera-liquid-backing";

// Mibera Collection handlers (transfer/mint/burn tracking)
import { handleMiberaCollectionTransfer } from "./handlers/mibera-collection";

// Re-export the handler consts so the imports above are "used" — registration is
// the side-effect of importing the modules. Mirrors src/EventHandlers.ts.
export {
  handleLoanReceived,
  handleBackingLoanPayedBack,
  handleBackingLoanExpired,
  handleItemLoaned,
  handleLoanItemSentBack,
  handleItemLoanExpired,
  handleItemPurchased,
  handleItemRedeemed,
  handleRFVChanged,
  handleMiberaCollectionTransfer,
};
