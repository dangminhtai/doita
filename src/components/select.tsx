"use client";

import { Children, isValidElement, type ReactNode } from "react";
import * as Primitive from "@radix-ui/react-select";
import { Check, ChevronDown, ChevronUp } from "@/components/icons";

type Option = {
  value: string | number;
  children: ReactNode;
  disabled?: boolean;
};

export function Select({
  value,
  onValueChange,
  children,
  disabled,
  name,
  required,
  "aria-labelledby": labelledBy,
}: {
  value: string | number;
  onValueChange: (value: string) => void;
  children: ReactNode;
  disabled?: boolean;
  name?: string;
  required?: boolean;
  "aria-labelledby"?: string;
}) {
  const options = Children.toArray(children).filter(isValidElement<Option>);
  return (
    <Primitive.Root
      value={String(value)}
      onValueChange={onValueChange}
      disabled={disabled}
      name={name}
      required={required}
    >
      <Primitive.Trigger
        className="doita-select"
        aria-labelledby={labelledBy}
        data-value={String(value)}
      >
        <Primitive.Value />
        <Primitive.Icon>
          <ChevronDown size={18} />
        </Primitive.Icon>
      </Primitive.Trigger>
      <Primitive.Portal>
        <Primitive.Content
          className="doita-select-menu"
          position="popper"
          sideOffset={8}
          collisionPadding={16}
        >
          <Primitive.ScrollUpButton className="doita-select-scroll">
            <ChevronUp size={18} />
          </Primitive.ScrollUpButton>
          <Primitive.Viewport className="doita-select-options">
            {options.map((option) => (
              <Primitive.Item
                className="doita-select-option"
                data-value={String(option.props.value)}
                key={option.props.value}
                value={String(option.props.value)}
                disabled={option.props.disabled}
              >
                <Primitive.ItemText>{option.props.children}</Primitive.ItemText>
                <Primitive.ItemIndicator>
                  <Check size={18} />
                </Primitive.ItemIndicator>
              </Primitive.Item>
            ))}
          </Primitive.Viewport>
          <Primitive.ScrollDownButton className="doita-select-scroll">
            <ChevronDown size={18} />
          </Primitive.ScrollDownButton>
        </Primitive.Content>
      </Primitive.Portal>
    </Primitive.Root>
  );
}
