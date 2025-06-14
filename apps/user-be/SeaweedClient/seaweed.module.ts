import { DynamicModule, Module } from "@nestjs/common";
import { SeaweedOptions } from "./interfaces/seaweed-module-options";
import { StorageService } from "./services/storage.services";
import { ConfigService } from "@nestjs/config";

@Module({})
export class SeaweedModule {
  static forRoot(options: SeaweedOptions): DynamicModule {
    const storageProvider = {
      provide: StorageService,
      useValue: new StorageService(options),
    };

    return {
      module: SeaweedModule,
      providers: [storageProvider],
      exports: [storageProvider],
    };
  }

  static forRootAsync(): DynamicModule {
    const storageProvider = {
      provide: StorageService,
      useFactory: (configService: ConfigService) => {
        const options: SeaweedOptions = {
          access_key: configService.get<string>('SEAWEED_ACCESS_KEY'),
          secret_key: configService.get<string>('SEAWEED_SECRET_KEY'),
          s3_endpoint: configService.get<string>('SEAWEED_S3_ENDPOINT'),
        };
        return new StorageService(options);
      },
      inject: [ConfigService],
    };

    return {
      module: SeaweedModule,
      imports: [], 
      providers: [storageProvider],
      exports: [storageProvider],
    };
  }
}
