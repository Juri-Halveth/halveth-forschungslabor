// SPDX-License-Identifier: MIT
// A data-only bridge for local consumers; it does not train or control an entity.
export function toLucinetObservation(packet) {
  if (packet?.schema !== "halveth.network-candidate.v2" ||
      !/^[a-f0-9]{64}$/.test(packet.source?.frameSha256 ?? "") ||
      !Array.isArray(packet.observations) || packet.observations.length < 1 ||
      !packet.observations.every((item) =>
        item.evidenceClass === "DECODED_FRAME_MEASUREMENT" &&
        item.sourceFrameSha256 === packet.source.frameSha256 &&
        Array.isArray(item.fourArmPixels)) ||
      !Array.isArray(packet.candidates))
    throw new TypeError("Expected a source-bound network candidate v2 packet");
  const motifs = packet.observations.flatMap((item) => item.fourArmPixels.map(({ x, y }) =>
    ({ threshold: item.threshold, x, y })));
  if ((motifs.length === 0) !== (packet.candidates.length === 0) ||
      packet.candidates.some((item) => item.evidenceClass !== "SYNTHETIC_ILLUSTRATION") ||
      (motifs.length && packet.candidateStatus !== "OPEN_ILLUSTRATIONS_FOR_PIXEL_MOTIF") ||
      (!motifs.length && packet.candidateStatus !== "NO_FOUR_ARM_PIXEL_MOTIF"))
    throw new TypeError("Packet mixes pixel observations and spatial illustrations");
  return {
    schema: "lucinet.network-observation.v1",
    sourceFrameSha256: packet.source.frameSha256,
    observation: "FOUR_ARM_PIXEL_MOTIF",
    motifs,
    candidateModels: packet.candidates.map(({ id, evidenceClass }) => ({ id, evidenceClass })),
    decision: motifs.length ? "UNRESOLVED" : "NO_MATCH_FOR_DECLARED_MOTIF_RULE",
    nextEvidence: motifs.length ? "SECOND_CALIBRATED_VIEW_OR_KNOWN_3D_SOURCE" : null
  };
}
