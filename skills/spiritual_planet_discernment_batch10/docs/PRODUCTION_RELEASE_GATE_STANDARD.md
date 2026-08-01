# Production Release Gate 标准

## Gate判定

```text
APPROVED =
  all_critical_controls_pass
  AND evidence_complete
  AND tests_reproducible
  AND human_board_signed
  AND rollback_ready
  AND recertification_enabled
```

## 证书必须包含

- release_id；
- build_hash；
- manifests；
- model versions；
- prompt/policy versions；
- knowledge pack versions；
- test suite versions；
- open findings；
- accepted risks；
- deployment scope；
- expiry；
- signatories；
- rollback target；
- recertification triggers。

## 条件批准

条件批准必须：

- 明确功能限制；
- 明确租户和用户规模；
- 明确人工监督；
- 明确截止日期；
- 明确阻断功能；
- 明确转正式生产的证据要求。

## 撤销

发生C4或无法控制的C3时：

1. 立即暂停受影响功能；
2. 撤销或挂起证书；
3. 保存必要证据；
4. 通知相关负责人；
5. 评估用户影响；
6. 修复和回归；
7. 完整重新认证。
