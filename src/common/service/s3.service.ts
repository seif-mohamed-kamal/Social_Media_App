import {
  APPLICATION_NAME,
  AWS_ACCESS_KEY_ID,
  AWS_BACKET_NAME,
  AWS_EXPIRES_IN,
  AWS_REGION,
  AWS_SECRET_ACCESS_KEY,
} from "../../config/config.service";
import { randomUUID } from "crypto";
import { BadRequestException } from "../exceptions/domain.exception";
import {
  PutObjectCommand,
  S3Client,
  ObjectCannedACL,
  CompleteMultipartUploadCommandOutput,
  GetObjectCommand,
  GetObjectCommandOutput,
  DeleteObjectCommand,
  DeleteObjectCommandOutput,
  DeleteObjectsCommand,
  DeleteObjectsCommandOutput,
  ListObjectsV2Command,
  ListObjectsV2CommandOutput,
} from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { storageApproachEnum, uploadApproachEnum } from "../enum";
import { createReadStream } from "fs";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export class S3Service {
  private client: S3Client;

  constructor() {
    this.client = new S3Client({
      region: AWS_REGION,
      credentials: {
        accessKeyId: AWS_ACCESS_KEY_ID,
        secretAccessKey: AWS_SECRET_ACCESS_KEY,
      },
    });
  }

  async uploadAsset({
    storageApproch = storageApproachEnum.DISK,
    Bucket = AWS_BACKET_NAME,
    Path = "general",
    file,
    ACL = ObjectCannedACL.private,
    ContentType,
  }: {
    storageApproch?: storageApproachEnum;
    Bucket?: string;
    Path?: string;
    file: Express.Multer.File;
    ACL?: ObjectCannedACL;
    ContentType?: string | undefined;
  }) {
    const command = new PutObjectCommand({
      Bucket,
      Key: `SocialMedia/${Path}/${randomUUID()}__${file.originalname}`,
      ACL,
      Body: file.buffer,
      ContentType: file.mimetype ?? ContentType,
    });
    if (!command.input?.Key) {
      throw new BadRequestException("Fail to upload this Asset");
    }
    await this.client.send(command);
    return command.input?.Key;
  }

  async uploadLargeFile({
    storageApproch = storageApproachEnum.DISK,
    Bucket = AWS_BACKET_NAME,
    Path = "general",
    file,
    ACL = ObjectCannedACL.private,
    ContentType,
    partSize = 5,
  }: {
    storageApproch?: storageApproachEnum;
    Bucket?: string;
    Path?: string;
    file: Express.Multer.File;
    ACL?: ObjectCannedACL;
    ContentType?: string | undefined;
    partSize?: number;
  }): Promise<CompleteMultipartUploadCommandOutput> {
    const uploadFile = new Upload({
      client: this.client,
      params: {
        Bucket,
        Key: `SocialMedia/${Path}/${randomUUID()}__${file.originalname}`,
        ACL,
        Body:
          storageApproch === storageApproachEnum.MEMORY
            ? file.buffer
            : createReadStream(file.path),
        ContentType: file.mimetype ?? ContentType,
      },
      partSize: partSize * 1024 * 1024,
    });
    // uploadFile.on("httpUploadProgress", (progress) => {
    //   console.log(progress);
    //   console.log(
    //     `File upload is ${
    //       ((progress.loaded as number) / (progress.total as number)) * 100
    //     }%`
    //   );
    // });
    return await uploadFile.done();
  }

  async uploadBulkAsset({
    uploadApproach = uploadApproachEnum.SMALL,
    storageApproch = storageApproachEnum.DISK,
    Bucket = AWS_BACKET_NAME,
    Path = "general",
    files,
    ACL = ObjectCannedACL.private,
    ContentType,
  }: {
    uploadApproach?: uploadApproachEnum;
    storageApproch?: storageApproachEnum;
    Bucket?: string;
    Path?: string;
    files: Express.Multer.File[];
    ACL?: ObjectCannedACL;
    ContentType?: string | undefined;
  }): Promise<string[]> {
    let urls: string[] = [];
    if (uploadApproach === uploadApproachEnum.LARGE) {
      let data = await Promise.all(
        files.map((file) => {
          return this.uploadLargeFile({
            storageApproch,
            file,
            ACL,
            Bucket,
            ContentType,
            Path,
          });
        })
      );
      urls = data.map((ele) => ele.Key as string);
    } else {
      urls = await Promise.all(
        files.map((file) => {
          return this.uploadAsset({
            storageApproch,
            file,
            ACL,
            Bucket,
            ContentType,
            Path,
          });
        })
      );
    }
    return urls;
  }

  async createPreSignedUploadLink({
    Bucket = AWS_BACKET_NAME,
    Path = "general",
    OriginalName,
    expiresIn = AWS_EXPIRES_IN,
    ContentType,
  }: {
    Bucket?: string;
    Path?: string;
    expiresIn?: number;
    OriginalName: string;
    ContentType: string;
  }): Promise<{ url: string; key: string }> {
    const command = new PutObjectCommand({
      Bucket,
      Key: `SocialMedia/${Path}/${randomUUID()}__${OriginalName}`,
      ContentType,
    });
    if (!command.input?.Key) {
      throw new BadRequestException("Fail to upload this Asset");
    }
    const url = await getSignedUrl(this.client, command, { expiresIn });
    return { url, key: command.input?.Key };
  }

  async getAsset({
    Bucket = AWS_BACKET_NAME,
    Key,
  }: {
    Bucket?: string;
    Key: string;
  }): Promise<GetObjectCommandOutput> {
    const command = new GetObjectCommand({
      Bucket,
      Key,
    });
    return await this.client.send(command);
  }

  async createPreSignedFetchLink({
    Bucket = AWS_BACKET_NAME,
    Key,
    fileName,
    download,
    expiresIn = AWS_EXPIRES_IN,
  }: {
    Bucket?: string;
    Key: string;
    expiresIn?: number;
    fileName?: string | undefined;
    download?: string | undefined;
  }): Promise<string> {
    const command = new GetObjectCommand({
      Bucket,
      Key,
      ResponseContentDisposition:
        download == "true"
          ? `attachment; filename="${fileName || Key.split("/").pop()}"`
          : (undefined as any),
    });
    const url = await getSignedUrl(this.client, command, { expiresIn });
    return url;
  }

  async deleteAsset({
    Bucket = AWS_BACKET_NAME,
    Key,
  }: {
    Bucket?: string;
    Key: string;
  }): Promise<DeleteObjectCommandOutput> {
    const command = new DeleteObjectCommand({
      Bucket,
      Key,
    });
    return await this.client.send(command);
  }

  async deleteBulkAsset({
    Bucket = AWS_BACKET_NAME,
    Keys,
  }: {
    Bucket?: string;
    Keys: { Key: string }[];
  }): Promise<DeleteObjectsCommandOutput> {
    const command = new DeleteObjectsCommand({
      Bucket,
      Delete: {
        Objects: Keys,
        Quiet: false,
      },
    });
    return await this.client.send(command);
  }

  async listFolderDir({
    Bucket = AWS_BACKET_NAME,
    Prefix,
  }: {
    Bucket?: string;
    Prefix: string;
  }): Promise<ListObjectsV2CommandOutput> {
    const command = new ListObjectsV2Command({
      Bucket,
      Prefix: `${APPLICATION_NAME}/${Prefix}`,
    });
    return await this.client.send(command);
  }

  async delteFolderByPrefix({
    Bucket = AWS_BACKET_NAME,
    Prefix,
  }: {
    Bucket?: string;
    Prefix: string;
  }): Promise<DeleteObjectsCommandOutput> {
    const res = await this.listFolderDir({ Bucket, Prefix });
    console.log(res.Contents)
    const Keys = res.Contents?.map((ele) => {
      return { Key: ele.Key };
    }) as { Key: string }[];
    
    return await this.deleteBulkAsset({ Bucket, Keys });
  }
}
export const s3Service = new S3Service();
