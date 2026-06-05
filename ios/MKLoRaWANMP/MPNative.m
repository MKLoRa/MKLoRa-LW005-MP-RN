#import "MPNative.h"

#import <CoreBluetooth/CoreBluetooth.h>
#import <React/RCTBridge.h>
#import <React/RCTUtils.h>
#import "BlePlx.h"
@import iOSDFULibrary;

static NSString *const kDfuEventProgress = @"MPDfuProgress";
static NSString *const kDfuEventSuccess = @"MPDfuSuccess";
static NSString *const kDfuEventError = @"MPDfuError";
static NSString *const kDfuEventUploading = @"MPDfuUploading";

@interface MPNative () <
  CBCentralManagerDelegate,
  DFUServiceDelegate,
  DFUProgressDelegate,
  LoggerDelegate>

@property (nonatomic, strong) CBCentralManager *centralManager;
@property (nonatomic, strong) DFUServiceController *dfuController;
@property (nonatomic, copy) NSString *pendingDeviceId;
@property (nonatomic, copy) NSString *pendingFileName;
@property (nonatomic, assign) BOOL hasListeners;

@end

@implementation MPNative

RCT_EXPORT_MODULE();

+ (BOOL)requiresMainQueueSetup
{
  return YES;
}

- (instancetype)init
{
  if (self = [super init]) {
    _centralManager = [[CBCentralManager alloc] initWithDelegate:self
                                                         queue:nil];
  }
  return self;
}

- (NSArray<NSString *> *)supportedEvents
{
  return @[
    kDfuEventProgress,
    kDfuEventSuccess,
    kDfuEventError,
    kDfuEventUploading,
  ];
}

- (void)startObserving
{
  self.hasListeners = YES;
}

- (void)stopObserving
{
  self.hasListeners = NO;
}

RCT_EXPORT_METHOD(listDocumentFiles : (RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject)
{
  NSString *document = NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES).firstObject;
  if (document.length == 0) {
    resolve(@[]);
    return;
  }
  NSError *error = nil;
  NSArray<NSString *> *list = [[NSFileManager defaultManager] contentsOfDirectoryAtPath:document error:&error];
  if (error != nil) {
    reject(@"list_error", error.localizedDescription, error);
    return;
  }
  resolve(list ?: @[]);
}

RCT_EXPORT_METHOD(getDocumentsDirectory : (RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject)
{
  NSString *document = NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES).firstObject;
  resolve(document ?: @"");
}

RCT_EXPORT_METHOD(writeDebuggerLogFile : (NSString *)fileName content : (NSString *)content resolver : (RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject)
{
  if (fileName.length == 0 || content.length == 0) {
    reject(@"invalid_args", @"fileName and content required", nil);
    return;
  }
  NSString *document = NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES).firstObject;
  if (document.length == 0) {
    reject(@"write_error", @"Documents directory unavailable", nil);
    return;
  }
  NSString *safeName = fileName;
  if (![safeName hasSuffix:@".txt"]) {
    safeName = [safeName stringByAppendingString:@".txt"];
  }
  NSString *filePath = [document stringByAppendingPathComponent:safeName];
  NSError *error = nil;
  BOOL ok = [content writeToFile:filePath atomically:YES encoding:NSUTF8StringEncoding error:&error];
  if (!ok) {
    reject(@"write_error", error.localizedDescription ?: @"write failed", error);
    return;
  }
  resolve(filePath);
}

RCT_EXPORT_METHOD(shareFiles : (NSArray *)filePaths resolver : (RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject)
{
  dispatch_async(dispatch_get_main_queue(), ^{
    if (![filePaths isKindOfClass:[NSArray class]] || filePaths.count == 0) {
      reject(@"invalid_args", @"No files to share", nil);
      return;
    }

    NSMutableArray *items = [NSMutableArray array];
    for (id pathObj in filePaths) {
      if (![pathObj isKindOfClass:[NSString class]]) {
        continue;
      }
      NSString *path = (NSString *)pathObj;
      if (path.length == 0) {
        continue;
      }
      NSURL *url = [NSURL fileURLWithPath:path];
      if (url != nil) {
        [items addObject:url];
      }
    }
    if (items.count == 0) {
      reject(@"invalid_args", @"No valid files", nil);
      return;
    }

    UIViewController *presenter = RCTPresentedViewController();
    if (presenter == nil) {
      reject(@"no_activity", @"View controller not available", nil);
      return;
    }

    UIActivityViewController *shareController =
      [[UIActivityViewController alloc] initWithActivityItems:items applicationActivities:nil];
    if (UI_USER_INTERFACE_IDIOM() == UIUserInterfaceIdiomPad) {
      shareController.popoverPresentationController.sourceView = presenter.view;
      shareController.popoverPresentationController.sourceRect =
        CGRectMake(CGRectGetMidX(presenter.view.bounds), CGRectGetMidY(presenter.view.bounds), 1, 1);
    }
    shareController.completionWithItemsHandler =
      ^(UIActivityType activityType, BOOL completed, NSArray *returnedItems, NSError *activityError) {
        if (activityError != nil) {
          reject(@"share_error", activityError.localizedDescription, activityError);
          return;
        }
        if (!completed) {
          reject(@"cancelled", @"User cancelled", nil);
          return;
        }
        resolve(@(YES));
      };
    [presenter presentViewController:shareController animated:YES completion:nil];
  });
}

RCT_EXPORT_METHOD(startDFU : (NSString *)deviceId fileName : (NSString *)fileName)
{
  dispatch_async(dispatch_get_main_queue(), ^{
    self.pendingDeviceId = deviceId;
    self.pendingFileName = fileName;
    [self tryStartPendingDFU];
  });
}

RCT_EXPORT_METHOD(cancelDFU)
{
  dispatch_async(dispatch_get_main_queue(), ^{
    [self.dfuController abort];
    self.dfuController = nil;
    self.pendingDeviceId = nil;
    self.pendingFileName = nil;
  });
}

#pragma mark - CBCentralManagerDelegate

- (void)centralManagerDidUpdateState:(CBCentralManager *)central
{
  [self tryStartPendingDFU];
}

#pragma mark - DFU

- (void)tryStartPendingDFU
{
  if (self.pendingDeviceId.length == 0 || self.pendingFileName.length == 0) {
    return;
  }
  if (self.centralManager.state != CBManagerStatePoweredOn) {
    return;
  }

  NSString *deviceId = self.pendingDeviceId;
  NSString *fileName = self.pendingFileName;
  self.pendingDeviceId = nil;
  self.pendingFileName = nil;

  NSString *document = NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES).firstObject;
  NSString *filePath = [document stringByAppendingPathComponent:fileName];
  if (filePath.length == 0 || ![[NSFileManager defaultManager] fileExistsAtPath:filePath]) {
    [self emitError:@"Dfu upgrade failure!"];
    return;
  }

  NSData *zipData = [NSData dataWithContentsOfFile:filePath];
  if (zipData.length == 0) {
    [self emitError:@"Dfu upgrade failure!"];
    return;
  }

  NSError *firmwareError = nil;
  DFUFirmware *firmware = [[DFUFirmware alloc] initWithZipFile:zipData error:&firmwareError];
  if (firmware == nil) {
    [self emitError:firmwareError.localizedDescription ?: @"Dfu upgrade failure!"];
    return;
  }

  CBPeripheral *peripheral = [self peripheralForDeviceId:deviceId];
  if (peripheral == nil) {
    [self emitError:@"Bluetooth peripheral not found. Keep the device connected and try again."];
    return;
  }

  dispatch_queue_t queue = dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0);
  DFUServiceInitiator *initiator = [[DFUServiceInitiator alloc]
    initWithQueue:queue
    delegateQueue:queue
    progressQueue:queue
    loggerQueue:queue
    centralManagerOptions:@{}];
  initiator = [initiator withFirmware:firmware];
  initiator.logger = self;
  initiator.delegate = self;
  initiator.progressDelegate = self;

  self.dfuController = [initiator startWithTarget:peripheral];
}

/// 对齐 MKADDFUModule：startWithTarget 使用应用侧已连接 peripheral（非独立 central 检索）
- (CBPeripheral *)peripheralForDeviceId:(NSString *)deviceId
{
  CBPeripheral *fromBlePlx = [self connectedPeripheralFromBlePlx:deviceId];
  if (fromBlePlx != nil) {
    return fromBlePlx;
  }

  NSUUID *uuid = [[NSUUID alloc] initWithUUIDString:deviceId];
  if (uuid != nil) {
    NSArray<CBPeripheral *> *known = [self.centralManager retrievePeripheralsWithIdentifiers:@[uuid]];
    if (known.count > 0) {
      return known.firstObject;
    }
  }

  CBUUID *serviceUUID = [CBUUID UUIDWithString:@"0000AA00-0000-1000-8000-00805f9b34fb"];
  NSArray<CBPeripheral *> *connected =
    [self.centralManager retrieveConnectedPeripheralsWithServices:@[serviceUUID]];
  NSString *target = deviceId.uppercaseString;
  for (CBPeripheral *peripheral in connected) {
    if ([peripheral.identifier.UUIDString.uppercaseString isEqualToString:target]) {
      return peripheral;
    }
  }
  return nil;
}

- (CBPeripheral *)connectedPeripheralFromBlePlx:(NSString *)deviceId
{
  if (deviceId.length == 0 || self.bridge == nil) {
    return nil;
  }
  BlePlx *blePlx = [self.bridge moduleForClass:[BlePlx class]];
  if (blePlx == nil) {
    return nil;
  }
  id bleManager = nil;
  @try {
    bleManager = [blePlx valueForKey:@"manager"];
  } @catch (__unused NSException *exception) {
    return nil;
  }
  if (bleManager == nil) {
    return nil;
  }

  NSUUID *uuid = [[NSUUID alloc] initWithUUIDString:deviceId];
  if (uuid == nil) {
    return nil;
  }

  NSDictionary *connected = nil;
  @try {
    connected = [bleManager valueForKey:@"connectedPeripherals"];
  } @catch (__unused NSException *exception) {
    return nil;
  }
  if (![connected isKindOfClass:[NSDictionary class]]) {
    return nil;
  }

  id rxPeriph = connected[uuid];
  if (rxPeriph == nil) {
    NSString *target = deviceId.uppercaseString;
    for (id key in connected) {
      if (![key isKindOfClass:[NSUUID class]]) {
        continue;
      }
      NSUUID *keyUuid = (NSUUID *)key;
      if ([keyUuid.UUIDString.uppercaseString isEqualToString:target]) {
        rxPeriph = connected[key];
        break;
      }
    }
  }
  if (rxPeriph == nil) {
    return nil;
  }

  SEL cbSel = NSSelectorFromString(@"cbPeripheral");
  if (![rxPeriph respondsToSelector:cbSel]) {
    return nil;
  }
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Warc-performSelector-leaks"
  CBPeripheral *cb = [rxPeriph performSelector:cbSel];
#pragma clang diagnostic pop
  return [cb isKindOfClass:[CBPeripheral class]] ? cb : nil;
}

- (void)emitError:(NSString *)message
{
  if (!self.hasListeners) {
    return;
  }
  [self sendEventWithName:kDfuEventError body:@{@"message": message ?: @"DFU failed"}];
}

#pragma mark - DFUServiceDelegate

- (void)dfuStateDidChangeTo:(enum DFUState)state
{
  if (state == DFUStateUploading) {
    dispatch_async(dispatch_get_main_queue(), ^{
      if (self.hasListeners) {
        [self sendEventWithName:kDfuEventUploading body:@{}];
      }
    });
  }
  if (state == DFUStateCompleted) {
    dispatch_async(dispatch_get_main_queue(), ^{
      if (self.hasListeners) {
        [self sendEventWithName:kDfuEventSuccess body:@{}];
      }
    });
  }
}

- (void)dfuError:(enum DFUError)error didOccurWithMessage:(NSString *)message
{
  [self emitError:message];
}

#pragma mark - DFUProgressDelegate

- (void)dfuProgressDidChangeFor:(NSInteger)part
                          outOf:(NSInteger)totalParts
                             to:(NSInteger)progress
   currentSpeedBytesPerSecond:(double)currentSpeedBytesPerSecond
     avgSpeedBytesPerSecond:(double)avgSpeedBytesPerSecond
{
  // Nordic: progress 为当前 part 的 0–100%，part 从 1 开始
  float currentProgress = 0.f;
  if (totalParts > 0) {
    currentProgress =
      ((float)(part - 1) + (float)progress / 100.f) / (float)totalParts;
  }
  currentProgress = fminf(fmaxf(currentProgress, 0.f), 1.f);
  dispatch_async(dispatch_get_main_queue(), ^{
    if (self.hasListeners) {
      [self sendEventWithName:kDfuEventProgress body:@{@"progress": @(currentProgress)}];
    }
  });
}

#pragma mark - LoggerDelegate

- (void)logWith:(enum LogLevel)level message:(NSString *)message
{
  NSLog(@"MPNative DFU %ld: %@", (long)level, message);
}

@end
