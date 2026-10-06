public sealed class AmazonS3FileStorage : IFileStorage
{
    private readonly S3FileStorage inner;

    public AmazonS3FileStorage(AmazonS3StorageOptions options)
    {
        inner = new S3FileStorage(options.ToS3Options());
    }

    public Task<StoredFile> StoreAsync(StorageWriteRequest request) =>
        inner.StoreAsync(request);
}
