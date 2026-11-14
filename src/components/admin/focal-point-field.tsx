"use client";

import Image from "next/image";
import { useId, useState, type PointerEvent } from "react";

/**
 * Ponto de foco: o centro dos cortes da foto nos cards (4:5) e nas miniaturas
 * (quadradas). Toque na foto para marcar, ou use os controles deslizantes
 * (teclado e leitor de tela). Com `named`, os valores vão no formulário como
 * focalX/focalY; senão, quem usa recebe as mudanças por `onChange`.
 */
export function FocalPointField({
  src,
  alt,
  width,
  height,
  defaultX,
  defaultY,
  idPrefix,
  named = true,
  onChange,
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  defaultX: number;
  defaultY: number;
  idPrefix: string;
  named?: boolean;
  onChange?: (x: number, y: number) => void;
}) {
  const [x, setXState] = useState(defaultX);
  const [y, setYState] = useState(defaultY);
  const setX = (value: number) => {
    setXState(value);
    onChange?.(value, y);
  };
  const setY = (value: number) => {
    setYState(value);
    onChange?.(x, value);
  };
  // Foto recém-escolhida (ainda no navegador) não passa pelo otimizador.
  const unoptimized = src.startsWith("blob:");
  const hintId = useId();
  const position = `${x}% ${y}%`;

  const pick = (event: PointerEvent<HTMLButtonElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    const nextX = Math.round(Math.min(100, Math.max(0, ((event.clientX - box.left) / box.width) * 100)));
    const nextY = Math.round(Math.min(100, Math.max(0, ((event.clientY - box.top) / box.height) * 100)));
    setXState(nextX);
    setYState(nextY);
    onChange?.(nextX, nextY);
  };

  return (
    <fieldset className="flex flex-col gap-3" aria-describedby={hintId}>
      <legend className="text-[15px] font-medium">Ponto de foco</legend>
      <p id={hintId} className="text-sm text-plum-muted">
        Toque na parte mais importante da foto (um rosto, por exemplo). Os cortes dos cards ficam centrados nela.
      </p>
      <div className="flex flex-wrap items-start gap-4">
        {/* Botão sem texto próprio: o mesmo ajuste existe nos controles abaixo. */}
        <button
          type="button"
          tabIndex={-1}
          aria-hidden="true"
          onPointerDown={pick}
          className="relative w-full max-w-64 cursor-crosshair overflow-hidden rounded-xl bg-blush"
        >
          <Image src={src} alt="" width={width} height={height} sizes="256px" unoptimized={unoptimized} className="h-auto w-full" />
          <span
            className="pointer-events-none absolute size-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-orange-cta/70 shadow"
            style={{ left: `${x}%`, top: `${y}%` }}
          />
        </button>
        <div className="flex gap-3" aria-label="Prévia dos cortes">
          <Crop label="Card" aspect="aspect-[4/5]" src={src} alt={alt} position={position} unoptimized={unoptimized} />
          <Crop label="Miniatura" aspect="aspect-square" src={src} alt={alt} position={position} unoptimized={unoptimized} />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Slider id={`${idPrefix}-foco-x`} name={named ? "focalX" : undefined} label="Horizontal" value={x} onChange={setX} ends={["esquerda", "direita"]} />
        <Slider id={`${idPrefix}-foco-y`} name={named ? "focalY" : undefined} label="Vertical" value={y} onChange={setY} ends={["topo", "base"]} />
      </div>
    </fieldset>
  );
}

function Crop({
  label,
  aspect,
  src,
  alt,
  position,
  unoptimized,
}: {
  label: string;
  aspect: string;
  src: string;
  alt: string;
  position: string;
  unoptimized: boolean;
}) {
  return (
    <figure className="flex w-20 flex-col gap-1">
      <div className={`relative ${aspect} overflow-hidden rounded-lg bg-blush`}>
        <Image
          src={src}
          alt={`Prévia (${label.toLowerCase()}): ${alt || "foto"}`}
          fill
          sizes="80px"
          unoptimized={unoptimized}
          className="object-cover"
          style={{ objectPosition: position }}
        />
      </div>
      <figcaption className="text-center text-xs text-plum-muted">{label}</figcaption>
    </figure>
  );
}

function Slider({
  id,
  name,
  label,
  value,
  onChange,
  ends,
}: {
  id: string;
  name?: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
  ends: [string, string];
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm">
        {label}: {value}%
      </label>
      <input
        id={id}
        name={name}
        type="range"
        min={0}
        max={100}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-valuetext={`${value}% (0 = ${ends[0]}, 100 = ${ends[1]})`}
        className="min-h-11 w-full accent-orange-cta"
      />
    </div>
  );
}
