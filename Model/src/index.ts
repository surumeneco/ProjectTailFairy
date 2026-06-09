/**
 * @tail-fairy/model
 * Spiking Neural Network model (WebGPU accelerated).
 *
 * 公開範囲（カプセル化）: 外部へ export するのは最外殻のエージェントクラスと
 * 入出力に必要な最小限の型のみ。内部クラスは非公開とする。
 * （エージェントクラスは未実装のため、現状は共有ドメイン型のみ re-export）
 */

export * from "./Classes/Types";
