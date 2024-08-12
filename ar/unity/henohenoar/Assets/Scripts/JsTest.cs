using UnityEngine;
using UnityEngine.UI;

[RequireComponent(typeof(MeshRenderer))]
public class JsTest : MonoBehaviour
{
    private MeshRenderer _meshRenderer;
    
    // Start is called once before the first execution of Update after the MonoBehaviour is created
    void Start()
    {
        _meshRenderer = GetComponent<MeshRenderer>();
        SetMeshEnabled(false);
    }
    
    public void SetMeshEnabled(bool enabled)
    {
        _meshRenderer.enabled = enabled;
    }
}
