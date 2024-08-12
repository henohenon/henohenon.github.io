using UnityEngine;
using UnityEngine.UI;

[RequireComponent(typeof(RawImage))]
public class CameraManager : MonoBehaviour
{
    private static int inputSize = 256;
    private static int fps = 30;
    
    private RawImage rawImage;
    WebCamTexture webCamTexture;
    
    // Start is called once before the first execution of Update after the MonoBehaviour is created
    void Start()
    {
        this.rawImage = GetComponent<RawImage>();
        this.webCamTexture = new WebCamTexture(inputSize, inputSize, fps);
        this.rawImage.texture = this.webCamTexture;
        this.webCamTexture.Play();
    }

    // Update is called once per frame
    void Update()
    {
        
    }
}
