# MKLoRaWANMP (LW005-MP)

React Native app for **LW005-MP** smart plug, ported from native `MKLoRaWAN-MP`.

## Protocol (LW005-MP)

| | 2B-CMD 型号 | MP (LW005) |
|---|-----|------------|
| Frame | `ED + FLAG + CMD(2B) + LEN + DATA` | `ED + FLAG + CMD(1B) + LEN + DATA` |
| Read example | `ed00002500` | `ed000100` |
| Scan | Service AA17 | Service **AA04**, manufacturer 25B header **04AA** |
| BLE chars | AA02 custom | **AA02** params, **AA03** control |

## Project path

`/Users/aa/Desktop/RN/LoRa/MKLoRaWANMP`

## Generate SDK from native

```bash
python3 scripts/generate_task_adopter.py
python3 scripts/generate_interface.py
python3 scripts/generate_interface_config.py
```

## Run

```bash
npm install
npm start
npm run ios   # or npm run android
```

### iOS `pod install` 失败时

常见报错：`CDN: trunk URL couldn't be downloaded`（HTTP2 framing）、`fast_float` 找不到、或 Rosetta 警告。

在 **arm64** 终端执行（不要用 Rosetta 模式的 Terminal）：

```bash
cd ios
chmod +x pod_install.sh
./pod_install.sh
```

若仍失败，可改为从源码拉取 RN 依赖（较慢但更稳）：

```bash
cd ios
CURL_HTTP_VERSION=1.1 RCT_USE_RN_DEP=0 RCT_USE_PREBUILT_RNCORE=0 arch -arm64 pod install --repo-update
```

Rosetta 警告：系统设置 → 终端 → 关闭「使用 Rosetta 打开」，或执行 `env /usr/bin/arch -arm64 /bin/bash --login` 后再 `pod install`。

## Tabs

LORA · GENERAL · BLUETOOTH · DEVICE (aligned with native `MKMPTabBarController`)
