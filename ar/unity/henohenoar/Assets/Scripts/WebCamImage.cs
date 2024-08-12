using System.Drawing;
using UnityEngine;
using UnityEngine.UI;

[RequireComponent(typeof(RawImage))]
public class WebImage : MonoBehaviour
{
    private static int _width = 640;
    private static int _height = 480;
    private static int fps = 30;
    
    private WebCamTexture _webCamTexture;
    private RawImage _rawImage;
    
    // Start is called once before the first execution of Update after the MonoBehaviour is created
    void Start()
    {
        _rawImage = GetComponent<RawImage>();
        _webCamTexture = new WebCamTexture(_width, _height, fps);
        _rawImage.texture = _webCamTexture;
        _webCamTexture.Play();
    }

    // Update is called once per frame
    void Update()
    {
        
    }
}
