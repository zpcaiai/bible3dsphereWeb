import { useRef } from 'react'
import useFocusTrap from './useFocusTrap'

// AccessibleModal —— 可复用的无障碍对话框基元。
// 提供：role="dialog" + aria-modal、初始聚焦、焦点陷阱（Tab 循环）、
// Esc 关闭、关闭后焦点归还、点击遮罩关闭。
//
// 设计目标是「就地包裹」现有弹层：把原来的
//   <div style={S.overlay} onClick={onClose}>
//     <div style={S.card} onClick={e => e.stopPropagation()}> … </div>
//   </div>
// 替换为
//   <AccessibleModal onClose={onClose} overlayStyle={S.overlay} contentStyle={S.card} label="标题">
//     …
//   </AccessibleModal>
// 样式与行为保持一致（遮罩点击关闭、内容点击不冒泡），额外获得无障碍能力。
//
// Props：
//   onClose            关闭回调（Esc 与遮罩点击都会调用）
//   label              aria-label（无可见标题时使用）
//   labelledBy         aria-labelledby（指向可见标题元素 id，优先于 label）
//   describedBy        aria-describedby（可选）
//   role               'dialog'（默认）或 'alertdialog'
//   overlayStyle       遮罩内联样式
//   contentStyle       对话框内联样式
//   overlayClassName   遮罩类名
//   contentClassName   对话框类名
//   initialFocusRef    激活时首先聚焦的元素 ref（可选）
//   closeOnOverlayClick 点击遮罩是否关闭（默认 true）
//   closeOnEsc         Esc 是否关闭（默认 true）
//   returnFocus        关闭时是否归还焦点（默认 true）
export default function AccessibleModal({
  onClose,
  label,
  labelledBy,
  describedBy,
  role = 'dialog',
  overlayStyle,
  contentStyle,
  overlayClassName,
  contentClassName,
  initialFocusRef,
  closeOnOverlayClick = true,
  closeOnEsc = true,
  returnFocus = true,
  children,
}) {
  const contentRef = useRef(null)

  useFocusTrap(contentRef, {
    active: true,
    onEscape: closeOnEsc && onClose ? onClose : undefined,
    initialFocus: initialFocusRef,
    returnFocus,
  })

  const handleOverlayClick = (e) => {
    if (closeOnOverlayClick && onClose && e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div
      className={overlayClassName}
      style={overlayStyle}
      role="presentation"
      onClick={handleOverlayClick}
    >
      <div
        ref={contentRef}
        className={contentClassName}
        style={contentStyle}
        role={role}
        aria-modal="true"
        aria-label={labelledBy ? undefined : label}
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  )
}
