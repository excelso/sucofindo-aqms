<div class="form-group-control bg-white">
    <select class="form-control select2-custom {{ $class }}" name="{{ $name }}" id="{{ $id }}" {{ $disabled }} data-selected="{{ $selected }}">
        <option value="">...</option>
        @if($options != null)
            @foreach($options as $item)
                @php($select = $item->id == $selected ? 'selected' : '')
                <option value="{{ $item->id }}" {{ $select }}>
                    {{ $item->leave_name }}
                </option>
            @endforeach
        @endif
    </select>
</div>
